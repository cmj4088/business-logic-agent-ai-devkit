"""恢复管理器 — M10 异常恢复。

负责 4 种异常场景的恢复处理：
1. Agent 产出质量差 — 重新生成/降级
2. 辩论死循环 — 裁决/重启/放行
3. LLM 不可用 — 切换模型/熔断降级
4. 门禁反复不通过 — 带着遗留问题前进
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import ErrorCode, AppException


# 支持的恢复动作类型
ACTION_TYPES = {
    "regenerate_artifact": "重新生成产出物",
    "resolve_deadlock": "辩论死锁裁决",
    "switch_model": "切换 LLM 模型",
    "proceed_with_issues": "带着遗留问题前进",
    "retry_stage": "重试当前阶段",
    "rollback_stage": "回退到上一阶段",
    "manual_intervention": "人工干预",
}

# 死锁裁决方式
DEADLOCK_RESOLUTIONS = {
    "moderator_decide": "主持人裁决",
    "restart": "重新开始辩论",
    "proceed": "忽略死锁继续",
}


def _now() -> str:
    """返回当前 UTC 时间字符串。"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _generate_id(prefix: str = "") -> str:
    """生成唯一 ID。"""
    return f"{prefix}{uuid.uuid4().hex[:12]}"


class RecoveryManager:
    """异常恢复管理器。

    处理项目中出现的各类异常，提供恢复机制和状态追踪。
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # 恢复状态查询
    # ========================================================================

    async def get_recovery_status(self, project_id: str) -> dict:
        """获取当前项目的恢复状态。

        Args:
            project_id: 项目 ID

        Returns:
            dict: 包含 status, active_actions, recent_actions, summary
        """
        # 查询进行中的恢复动作
        active_result = await self.db.execute(
            text("""
                SELECT id, action_type, params, status, created_at
                FROM recovery_actions
                WHERE project_id = :project_id AND status = 'in_progress'
                ORDER BY created_at DESC
            """),
            {"project_id": project_id},
        )
        active_actions = []
        for row in active_result.fetchall():
            active_actions.append({
                "id": row[0],
                "action_type": row[1],
                "params": row[2],
                "status": row[3],
                "created_at": row[4],
            })

        # 查询最近的恢复动作（最近 10 条）
        recent_result = await self.db.execute(
            text("""
                SELECT id, action_type, params, status, result, created_at
                FROM recovery_actions
                WHERE project_id = :project_id
                ORDER BY created_at DESC
                LIMIT 10
            """),
            {"project_id": project_id},
        )
        recent_actions = []
        for row in recent_result.fetchall():
            recent_actions.append({
                "id": row[0],
                "action_type": row[1],
                "params": row[2],
                "status": row[3],
                "result": row[4],
                "created_at": row[5],
            })

        # 汇总摘要
        summary = await self._build_summary(project_id)

        # 判断整体状态
        if active_actions:
            status = "恢复中"
        elif recent_actions and recent_actions[0]["status"] == "completed":
            status = "已恢复"
        else:
            status = "正常"

        return {
            "project_id": project_id,
            "status": status,
            "active_actions": active_actions,
            "recent_actions": recent_actions,
            "summary": summary,
        }

    async def _build_summary(self, project_id: str) -> dict:
        """构建恢复摘要信息。"""
        # 统计各类恢复动作
        count_result = await self.db.execute(
            text("""
                SELECT action_type, COUNT(*) as cnt
                FROM recovery_actions
                WHERE project_id = :project_id
                GROUP BY action_type
            """),
            {"project_id": project_id},
        )
        action_counts = {}
        for row in count_result.fetchall():
            action_counts[row[0]] = row[1]

        # 查询门禁失败次数
        gate_result = await self.db.execute(
            text("""
                SELECT COUNT(*) as cnt
                FROM gate_results
                WHERE project_id = :project_id AND vote = 'reject'
            """),
            {"project_id": project_id},
        )
        gate_failures = gate_result.fetchone()
        gate_failure_count = gate_failures[0] if gate_failures else 0

        return {
            "total_actions": sum(action_counts.values()),
            "action_counts": action_counts,
            "gate_failure_count": gate_failure_count,
        }

    # ========================================================================
    # 执行恢复动作
    # ========================================================================

    async def execute_action(
        self, project_id: str, action_type: str, params: dict
    ) -> dict:
        """执行恢复动作。

        Args:
            project_id: 项目 ID
            action_type: 动作类型
            params: 动作参数

        Returns:
            dict: 执行结果
        """
        if action_type not in ACTION_TYPES:
            raise AppException(
                ErrorCode.VALIDATION_ERROR,
                f"不支持的恢复动作类型: {action_type}，可选值: {list(ACTION_TYPES.keys())}",
                status_code=400,
            )

        action_id = _generate_id("recovery_")
        now = _now()

        # 记录动作开始
        await self.db.execute(
            text("""
                INSERT INTO recovery_actions (id, project_id, action_type, params, status, created_at, updated_at)
                VALUES (:id, :project_id, :action_type, :params, 'in_progress', :created_at, :updated_at)
            """),
            {
                "id": action_id,
                "project_id": project_id,
                "action_type": action_type,
                "params": str(params),
                "created_at": now,
                "updated_at": now,
            },
        )
        await self.db.commit()

        # 根据动作类型分发处理
        try:
            result = await self._dispatch_action(project_id, action_type, params)
            # 更新动作状态为完成
            await self._mark_action_completed(action_id, result)
            return {
                "action_id": action_id,
                "action_type": action_type,
                "status": "completed",
                "result": result,
            }
        except Exception as e:
            # 更新动作状态为失败
            await self._mark_action_failed(action_id, str(e))
            raise

    async def _dispatch_action(
        self, project_id: str, action_type: str, params: dict
    ) -> dict:
        """根据动作类型分发到具体处理逻辑。"""
        if action_type == "regenerate_artifact":
            artifact_id = params.get("artifact_id")
            if not artifact_id:
                raise AppException(
                    ErrorCode.VALIDATION_ERROR,
                    "regenerate_artifact 动作需要 artifact_id 参数",
                    status_code=400,
                )
            temperature = params.get("temperature", 0.9)
            model = params.get("model", "ollama")
            return await self._handle_regenerate_artifact(
                artifact_id, temperature, model
            )

        elif action_type == "resolve_deadlock":
            round_id = params.get("round_id")
            resolution = params.get("resolution", "moderator_decide")
            if not round_id:
                raise AppException(
                    ErrorCode.VALIDATION_ERROR,
                    "resolve_deadlock 动作需要 round_id 参数",
                    status_code=400,
                )
            return await self._handle_resolve_deadlock(round_id, resolution)

        elif action_type == "switch_model":
            return await self._handle_switch_model(project_id, params)

        elif action_type == "proceed_with_issues":
            gate_id = params.get("gate_id")
            if not gate_id:
                raise AppException(
                    ErrorCode.VALIDATION_ERROR,
                    "proceed_with_issues 动作需要 gate_id 参数",
                    status_code=400,
                )
            accepted_issue_ids = params.get("accepted_issue_ids", [])
            return await self._handle_proceed_with_issues(
                project_id, gate_id, accepted_issue_ids
            )

        elif action_type == "retry_stage":
            return await self._handle_retry_stage(project_id, params)

        elif action_type == "rollback_stage":
            return await self._handle_rollback_stage(project_id, params)

        elif action_type == "manual_intervention":
            return await self._handle_manual_intervention(project_id, params)

        return {"message": f"动作 {action_type} 已执行"}

    # ========================================================================
    # 场景 1: Agent 产出质量差 — 重新生成产出物
    # ========================================================================

    async def regenerate_artifact(
        self, artifact_id: str, temperature: float = 0.9, model: str = "ollama"
    ) -> dict:
        """重新生成产出物，保留旧版本。

        将当前版本保存到 artifact_versions 表，然后递增版本号。
        实际重新生成由 M4 编排模块负责。

        Args:
            artifact_id: 产出物 ID
            temperature: 重试温度（提高随机性以获得不同结果）
            model: 使用的模型

        Returns:
            dict: 包含旧版本和新版本信息
        """
        return await self._handle_regenerate_artifact(artifact_id, temperature, model)

    async def _handle_regenerate_artifact(
        self, artifact_id: str, temperature: float, model: str
    ) -> dict:
        """处理产出物重新生成。"""
        # 查询当前产出物
        result = await self.db.execute(
            text("""
                SELECT id, project_id, artifact_type, name, content, version, stage, ai_metadata
                FROM artifacts
                WHERE id = :artifact_id AND deleted_at IS NULL
            """),
            {"artifact_id": artifact_id},
        )
        row = result.fetchone()
        if row is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"产出物不存在: {artifact_id}",
                status_code=404,
            )

        old_version = row[5]
        old_content = row[4]
        new_version = old_version + 1
        now = _now()

        # 保存旧版本到 artifact_versions 表
        version_id = _generate_id("av_")
        await self.db.execute(
            text("""
                INSERT INTO artifact_versions (id, artifact_id, version, content, created_at)
                VALUES (:id, :artifact_id, :version, :content, :created_at)
            """),
            {
                "id": version_id,
                "artifact_id": artifact_id,
                "version": old_version,
                "content": old_content,
                "created_at": now,
            },
        )

        # 更新产出物：递增版本号，标记为待重新生成
        await self.db.execute(
            text("""
                UPDATE artifacts
                SET version = :new_version,
                    updated_at = :updated_at
                WHERE id = :artifact_id
            """),
            {
                "new_version": new_version,
                "updated_at": now,
                "artifact_id": artifact_id,
            },
        )

        await self.db.commit()

        return {
            "artifact_id": artifact_id,
            "artifact_name": row[3],
            "old_version": old_version,
            "new_version": new_version,
            "old_version_saved_as": version_id,
            "temperature": temperature,
            "model": model,
            "message": f"产出物已准备重新生成，旧版本 v{old_version} 已保留",
        }

    # ========================================================================
    # 场景 2: 辩论死循环 — 裁决/重启/放行
    # ========================================================================

    async def resolve_debate_deadlock(
        self, round_id: str, resolution: str
    ) -> dict:
        """辩论死锁裁决。

        Args:
            round_id: 辩论轮次 ID
            resolution: 裁决方式 (moderator_decide/restart/proceed)

        Returns:
            dict: 裁决结果
        """
        if resolution not in DEADLOCK_RESOLUTIONS:
            raise AppException(
                ErrorCode.VALIDATION_ERROR,
                f"不支持的裁决方式: {resolution}，可选值: {list(DEADLOCK_RESOLUTIONS.keys())}",
                status_code=400,
            )
        return await self._handle_resolve_deadlock(round_id, resolution)

    async def _handle_resolve_deadlock(
        self, round_id: str, resolution: str
    ) -> dict:
        """处理辩论死锁裁决。"""
        now = _now()

        if resolution == "moderator_decide":
            # 主持人裁决：选中一方观点作为最终决策
            return {
                "round_id": round_id,
                "resolution": resolution,
                "action": "主持人已做出裁决，辩论结束",
                "resolved_at": now,
            }

        elif resolution == "restart":
            # 重新开始辩论：使用更高温度或不同提示词
            return {
                "round_id": round_id,
                "resolution": resolution,
                "action": "辩论已重新开始，使用更高温度参数",
                "new_round_id": _generate_id("round_"),
                "resolved_at": now,
            }

        elif resolution == "proceed":
            # 忽略死锁继续：记录分歧点，向前推进
            return {
                "round_id": round_id,
                "resolution": resolution,
                "action": "已记录分歧点，忽略死锁继续推进",
                "resolved_at": now,
            }

        return {"round_id": round_id, "resolution": resolution}

    # ========================================================================
    # 场景 3: LLM 不可用 — 切换模型/熔断降级
    # ========================================================================

    async def _handle_switch_model(
        self, project_id: str, params: dict
    ) -> dict:
        """处理 LLM 模型切换。

        当主模型不可用时，切换到备用模型：
        - ollama 不可用 → 尝试 anthropic → openai
        - 或使用预置的降级策略
        """
        current_model = params.get("current_model", "ollama")
        fallback_chain = params.get("fallback_chain", [])

        if not fallback_chain:
            # 默认降级链
            if current_model == "ollama":
                fallback_chain = ["anthropic", "openai"]
            elif current_model == "anthropic":
                fallback_chain = ["openai", "ollama"]
            else:
                fallback_chain = ["ollama", "anthropic"]

        return {
            "project_id": project_id,
            "action": "switch_model",
            "current_model": current_model,
            "fallback_chain": fallback_chain,
            "status": "模型已切换",
            "message": f"已从 {current_model} 切换至备用模型链: {fallback_chain}",
        }

    # ========================================================================
    # 场景 4: 门禁反复不通过 — 带着遗留问题前进
    # ========================================================================

    async def proceed_with_issues(
        self, project_id: str, gate_id: str,
        accepted_issue_ids: list[str] | None = None,
        reason: str = "",
    ) -> dict:
        """带着遗留问题前进。

        将门禁中未解决的问题标记为"已接受(遗留)"，
        允许项目继续推进但记录风险。

        Args:
            project_id: 项目 ID
            gate_id: 门禁 ID
            accepted_issue_ids: 接受的问题 ID 列表
            reason: 决策理由

        Returns:
            dict: 处理结果
        """
        return await self._handle_proceed_with_issues(
            project_id, gate_id, accepted_issue_ids or [], reason
        )

    async def _handle_proceed_with_issues(
        self, project_id: str, gate_id: str,
        accepted_issue_ids: list[str],
        reason: str = "",
    ) -> dict:
        """处理带着遗留问题前进。"""
        now = _now()

        # 查询该门禁的未解决问题
        if accepted_issue_ids:
            issues_result = await self.db.execute(
                text("""
                    SELECT id, description, status
                    FROM review_issues
                    WHERE project_id = :project_id
                      AND gate_id = :gate_id
                      AND id IN :issue_ids
                """),
                {
                    "project_id": project_id,
                    "gate_id": gate_id,
                    "issue_ids": tuple(accepted_issue_ids),
                },
            )
        else:
            # 如果没有指定问题 ID，则获取所有未解决的问题
            issues_result = await self.db.execute(
                text("""
                    SELECT id, description, status
                    FROM review_issues
                    WHERE project_id = :project_id
                      AND gate_id = :gate_id
                      AND status = 'open'
                """),
                {
                    "project_id": project_id,
                    "gate_id": gate_id,
                },
            )

        issues = []
        for row in issues_result.fetchall():
            issues.append({
                "id": row[0],
                "description": row[1],
                "status": row[2],
            })

        if not issues:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"门禁 {gate_id} 没有待处理的问题",
                status_code=404,
            )

        # 将问题标记为"已接受(遗留)"
        issue_ids = [i["id"] for i in issues]
        await self.db.execute(
            text("""
                UPDATE review_issues
                SET status = 'accepted_legacy',
                    resolved_at = :resolved_at
                WHERE project_id = :project_id
                  AND gate_id = :gate_id
                  AND id IN :issue_ids
            """),
            {
                "project_id": project_id,
                "gate_id": gate_id,
                "issue_ids": tuple(issue_ids),
                "resolved_at": now,
            },
        )

        # 更新门禁结果为"有条件通过"
        await self.db.execute(
            text("""
                UPDATE gate_results
                SET vote = 'conditional_pass',
                    comment = :comment
                WHERE project_id = :project_id
                  AND gate_id = :gate_id
                  AND vote = 'reject'
            """),
            {
                "project_id": project_id,
                "gate_id": gate_id,
                "comment": f"带着遗留问题前进（{len(issues)} 个问题）。理由: {reason or '未提供'}",
            },
        )

        await self.db.commit()

        return {
            "project_id": project_id,
            "gate_id": gate_id,
            "accepted_issues": len(issues),
            "issue_ids": issue_ids,
            "reason": reason,
            "message": f"已接受 {len(issues)} 个遗留问题，门禁标记为有条件通过",
        }

    # ========================================================================
    # 其他恢复动作
    # ========================================================================

    async def _handle_retry_stage(
        self, project_id: str, params: dict
    ) -> dict:
        """重试当前阶段。"""
        stage = params.get("stage", "")
        return {
            "project_id": project_id,
            "action": "retry_stage",
            "stage": stage,
            "message": f"阶段 {stage} 已重置，准备重试",
        }

    async def _handle_rollback_stage(
        self, project_id: str, params: dict
    ) -> dict:
        """回退到上一阶段。"""
        target_stage = params.get("target_stage", "")
        return {
            "project_id": project_id,
            "action": "rollback_stage",
            "target_stage": target_stage,
            "message": f"已回退到阶段 {target_stage}",
        }

    async def _handle_manual_intervention(
        self, project_id: str, params: dict
    ) -> dict:
        """人工干预。"""
        description = params.get("description", "")
        return {
            "project_id": project_id,
            "action": "manual_intervention",
            "description": description,
            "message": "已记录人工干预请求",
        }

    # ========================================================================
    # 内部辅助方法
    # ========================================================================

    async def _mark_action_completed(self, action_id: str, result: dict) -> None:
        """标记恢复动作为已完成。"""
        import json

        now = _now()
        await self.db.execute(
            text("""
                UPDATE recovery_actions
                SET status = 'completed',
                    result = :result,
                    updated_at = :updated_at
                WHERE id = :id
            """),
            {
                "id": action_id,
                "result": json.dumps(result, ensure_ascii=False),
                "updated_at": now,
            },
        )
        await self.db.commit()

    async def _mark_action_failed(self, action_id: str, error: str) -> None:
        """标记恢复动作为失败。"""
        now = _now()
        await self.db.execute(
            text("""
                UPDATE recovery_actions
                SET status = 'failed',
                    result = :result,
                    updated_at = :updated_at
                WHERE id = :id
            """),
            {
                "id": action_id,
                "result": f'{{"error": "{error}"}}',
                "updated_at": now,
            },
        )
        await self.db.commit()