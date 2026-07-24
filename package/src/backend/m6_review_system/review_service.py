"""审核服务 — M6 审核系统核心。

负责审核列表、投票、批量审核、升级、仪表盘聚合、遗留问题管理。
MVP 阶段默认单人模式：所有投票自动通过。
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import AppException, ErrorCode


def generate_review_id() -> str:
    return f"rvw_{uuid.uuid4().hex[:12]}"


def generate_gate_result_id() -> str:
    return f"gtr_{uuid.uuid4().hex[:12]}"


def generate_issue_id() -> str:
    return f"isu_{uuid.uuid4().hex[:12]}"


class ReviewService:
    """审核服务。

    所有数据库操作通过参数化 SQL 执行，支持单人模式自动通过。
    """

    # MVP 单人模式开关
    SINGLE_USER_MODE = True

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # 审核列表
    # ------------------------------------------------------------------

    # gate_id → (deliverableType, stage, stageLabel) 映射
    _GATE_MAP = {
        "gate_CDCP": ("CDCP", "concept", "概念阶段"),
        "gate_PDCP": ("PDCP", "plan", "规划阶段"),
        "gate_TR3": ("TR3", "develop", "开发阶段"),
        "gate_TR4": ("TR4", "develop", "开发阶段"),
        "gate_TR5": ("TR5", "develop", "开发阶段"),
        "gate_TR6": ("TR6", "verify", "验证阶段"),
        "gate_ADCP": ("ADCP", "launch", "发布阶段"),
        "gate_LDCP": ("LDCP", "lifecycle", "生命周期"),
    }

    # assigned_to → 中文标签
    _ROLE_LABELS = {
        "product_manager": "产品经理",
        "rd": "研发架构师",
        "qa": "测试专家",
        "marketing": "市场专家",
        "manufacturing": "制造工程师",
        "finance": "财务分析师",
    }

    def _enrich_review(self, row, project_name: str = "", industry: str = "") -> dict:
        """将 review_tasks 行转换为前端期望的 camelCase 完整对象。"""
        gate_id = row.gate_id
        deliverable_type, stage, stage_label = self._GATE_MAP.get(
            gate_id, ("CDCP", "concept", "概念阶段")
        )
        # 计算等待小时数
        waiting_hours = 0
        try:
            from datetime import datetime, timezone
            created = str(row.created_at)
            # 兼容 "YYYY-MM-DD HH:MM:SS" 格式
            dt = datetime.strptime(created, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            waiting_hours = max(0, int((datetime.now(timezone.utc) - dt).total_seconds() / 3600))
        except Exception:
            pass

        return {
            "id": row.id,
            "projectId": row.project_id,
            "projectName": project_name,
            "deliverableType": deliverable_type,
            "deliverableName": f"{deliverable_type} 评审",
            "stage": stage,
            "stageLabel": stage_label,
            "priority": "gray",
            "status": row.status,
            "industry": industry,
            "assignee": self._ROLE_LABELS.get(row.assigned_to, row.assigned_to or ""),
            "createdBy": row.assigned_to or "",
            "createdAt": str(row.created_at),
            "updatedAt": str(row.updated_at),
            "waitingHours": waiting_hours,
            "autoApproved": bool(row.auto_approved),
            # 兼容旧字段
            "project_id": row.project_id,
            "gate_id": gate_id,
            "artifact_id": row.artifact_id,
            "auto_approved": bool(row.auto_approved),
            "assigned_to": row.assigned_to,
        }

    async def list_reviews(
        self,
        project_id: str | None = None,
        status: str | None = None,
    ) -> dict:
        """获取审核任务列表。

        Args:
            project_id: 可选，按项目过滤。
            status: 可选，按状态过滤（pending/approved/rejected）。

        Returns:
            dict: 包含 items 列表和 total 计数的分页结果。
        """
        query = """
            SELECT r.*, p.name as project_name, p.industry as project_industry
            FROM review_tasks r
            LEFT JOIN projects p ON r.project_id = p.id
            WHERE 1=1
        """
        params: dict = {}

        if project_id:
            query += " AND r.project_id = :project_id"
            params["project_id"] = project_id

        if status:
            query += " AND r.status = :status"
            params["status"] = status

        query += " ORDER BY r.created_at DESC"

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()

        return {
            "items": [
                self._enrich_review(row, getattr(row, "project_name", "") or "", getattr(row, "project_industry", "") or "")
                for row in rows
            ],
            "total": len(rows),
        }

    # ------------------------------------------------------------------
    # 审核详情
    # ------------------------------------------------------------------

    async def get_review(self, review_id: str) -> dict:
        """获取审核详情，包含投票记录和关联问题。

        Args:
            review_id: 审核任务 ID。

        Returns:
            dict: 审核详情，含投票记录和遗留问题。
        """
        result = await self.db.execute(
            text("""
                SELECT r.*, p.name as project_name, p.industry as project_industry
                FROM review_tasks r
                LEFT JOIN projects p ON r.project_id = p.id
                WHERE r.id = :id
            """),
            {"id": review_id},
        )
        review = result.fetchone()
        if review is None:
            raise AppException(ErrorCode.NOT_FOUND, "审核任务不存在", status_code=404)

        # 查询关联的门禁投票记录
        votes_result = await self.db.execute(
            text(
                "SELECT * FROM gate_results WHERE project_id = :project_id AND gate_id = :gate_id "
                "ORDER BY attempt DESC"
            ),
            {"project_id": review.project_id, "gate_id": review.gate_id},
        )
        votes = votes_result.fetchall()

        # 查询关联的遗留问题
        issues_result = await self.db.execute(
            text(
                "SELECT * FROM review_issues WHERE project_id = :project_id AND gate_id = :gate_id"
            ),
            {"project_id": review.project_id, "gate_id": review.gate_id},
        )
        issues = issues_result.fetchall()

        # 基础字段（camelCase）
        base = self._enrich_review(
            review,
            getattr(review, "project_name", "") or "",
            getattr(review, "project_industry", "") or "",
        )
        # 追加投票和问题
        base["history"] = [
            {
                "id": v.id,
                "reviewId": review_id,
                "action": "投票",
                "reviewer": self._ROLE_LABELS.get(v.voter_role, v.voter_role or ""),
                "vote": v.vote,
                "comment": v.comment,
                "timestamp": str(v.created_at),
            }
            for v in votes
        ]
        base["issues"] = [
            {
                "id": i.id,
                "reviewId": review_id,
                "projectId": i.project_id,
                "projectName": getattr(review, "project_name", "") or "",
                "description": i.description,
                "severity": "minor",
                "status": i.status,
                "createdAt": str(i.created_at),
                "resolvedAt": str(i.resolved_at) if i.resolved_at else None,
            }
            for i in issues
        ]
        return base

    # ------------------------------------------------------------------
    # 提交投票
    # ------------------------------------------------------------------

    async def submit_vote(
        self,
        project_id: str,
        gate_id: str,
        voter_role: str,
        vote: str,
        comment: str = "",
    ) -> dict:
        """提交门禁投票。

        单人模式：所有投票自动通过，标注 auto_approved_due_to_single_user_mode。

        Args:
            project_id: 项目 ID。
            gate_id: 门禁 ID。
            voter_role: 投票人角色。
            vote: 投票结果（approve/reject/request_changes）。
            comment: 审核意见。

        Returns:
            dict: 投票记录。
        """
        # 验证 vote 值
        valid_votes = ("approve", "reject", "request_changes")
        if vote not in valid_votes:
            raise AppException(
                ErrorCode.VALIDATION_ERROR,
                f"无效的投票值，必须是: {', '.join(valid_votes)}",
                status_code=422,
            )

        # 单人模式：自动通过
        if self.SINGLE_USER_MODE:
            effective_vote = "approve"
            is_auto = True
        else:
            effective_vote = vote
            is_auto = False

        # 查询当前 attempt
        max_attempt_result = await self.db.execute(
            text(
                "SELECT COALESCE(MAX(attempt), 0) as max_attempt FROM gate_results "
                "WHERE project_id = :project_id AND gate_id = :gate_id"
            ),
            {"project_id": project_id, "gate_id": gate_id},
        )
        attempt = max_attempt_result.fetchone().max_attempt + 1

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        gate_result_id = generate_gate_result_id()

        # 插入门禁投票记录
        # 查询 project 以获取 stage
        stage_result = await self.db.execute(
            text("SELECT current_stage FROM projects WHERE id = :id"),
            {"id": project_id},
        )
        project_row = stage_result.fetchone()
        stage = project_row.current_stage if project_row else "unknown"

        await self.db.execute(
            text(
                "INSERT INTO gate_results (id, project_id, stage, gate_id, attempt, "
                "voter_role, vote, comment, is_auto_approved, created_at) "
                "VALUES (:id, :project_id, :stage, :gate_id, :attempt, "
                ":voter_role, :vote, :comment, :is_auto_approved, :created_at)"
            ),
            {
                "id": gate_result_id,
                "project_id": project_id,
                "stage": stage,
                "gate_id": gate_id,
                "attempt": attempt,
                "voter_role": voter_role,
                "vote": effective_vote,
                "comment": comment if not is_auto else "auto_approved_due_to_single_user_mode",
                "is_auto_approved": int(is_auto),
                "created_at": now,
            },
        )

        # 更新或创建对应的审核任务
        review_task_result = await self.db.execute(
            text(
                "SELECT id FROM review_tasks WHERE project_id = :project_id AND gate_id = :gate_id"
            ),
            {"project_id": project_id, "gate_id": gate_id},
        )
        existing_task = review_task_result.fetchone()

        if existing_task:
            await self.db.execute(
                text(
                    "UPDATE review_tasks SET status = :status, auto_approved = :auto_approved, "
                    "updated_at = :updated_at WHERE id = :id"
                ),
                {
                    "id": existing_task.id,
                    "status": "approved" if effective_vote == "approve" else "reviewing",
                    "auto_approved": int(is_auto),
                    "updated_at": now,
                },
            )
        else:
            review_id = generate_review_id()
            await self.db.execute(
                text(
                    "INSERT INTO review_tasks (id, project_id, gate_id, status, "
                    "auto_approved, created_at, updated_at) "
                    "VALUES (:id, :project_id, :gate_id, :status, "
                    ":auto_approved, :created_at, :updated_at)"
                ),
                {
                    "id": review_id,
                    "project_id": project_id,
                    "gate_id": gate_id,
                    "status": "approved" if effective_vote == "approve" else "reviewing",
                    "auto_approved": int(is_auto),
                    "created_at": now,
                    "updated_at": now,
                },
            )

        await self.db.commit()

        return {
            "id": gate_result_id,
            "project_id": project_id,
            "gate_id": gate_id,
            "attempt": attempt,
            "voter_role": voter_role,
            "vote": effective_vote,
            "comment": comment if not is_auto else "auto_approved_due_to_single_user_mode",
            "is_auto_approved": is_auto,
            "mode": "single_user" if self.SINGLE_USER_MODE else "multi_user",
            "created_at": now,
        }

    # ------------------------------------------------------------------
    # 批量审核
    # ------------------------------------------------------------------

    async def batch_vote(self, review_ids: list[str], vote: str) -> dict:
        """批量审核多个审核任务。

        Args:
            review_ids: 审核任务 ID 列表。
            vote: 投票结果（approve/reject）。

        Returns:
            dict: 包含处理结果列表。
        """
        valid_votes = ("approve", "reject")
        if vote not in valid_votes:
            raise AppException(
                ErrorCode.VALIDATION_ERROR,
                f"批量审核投票必须是 approve 或 reject",
                status_code=422,
            )

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        results = []

        for review_id in review_ids:
            # 获取审核任务
            task_result = await self.db.execute(
                text("SELECT * FROM review_tasks WHERE id = :id"),
                {"id": review_id},
            )
            task = task_result.fetchone()
            if task is None:
                results.append({
                    "review_id": review_id,
                    "success": False,
                    "message": "审核任务不存在",
                })
                continue

            is_auto = self.SINGLE_USER_MODE
            effective_vote = "approve" if is_auto else vote

            # 更新审核任务状态
            await self.db.execute(
                text(
                    "UPDATE review_tasks SET status = :status, auto_approved = :auto_approved, "
                    "updated_at = :updated_at WHERE id = :id"
                ),
                {
                    "id": review_id,
                    "status": "approved" if effective_vote == "approve" else "rejected",
                    "auto_approved": int(is_auto),
                    "updated_at": now,
                },
            )

            # 插入门禁投票记录
            gate_result_id = generate_gate_result_id()
            await self.db.execute(
                text(
                    "INSERT INTO gate_results (id, project_id, stage, gate_id, attempt, "
                    "voter_role, vote, comment, is_auto_approved, created_at) "
                    "VALUES (:id, :project_id, :stage, :gate_id, :attempt, "
                    ":voter_role, :vote, :comment, :is_auto_approved, :created_at)"
                ),
                {
                    "id": gate_result_id,
                    "project_id": task.project_id,
                    "stage": "unknown",
                    "gate_id": task.gate_id,
                    "attempt": 1,
                    "voter_role": "batch_reviewer",
                    "vote": effective_vote,
                    "comment": "auto_approved_due_to_single_user_mode" if is_auto else "批量审核",
                    "is_auto_approved": int(is_auto),
                    "created_at": now,
                },
            )

            results.append({
                "review_id": review_id,
                "success": True,
                "message": "已自动通过（单人模式）" if is_auto else f"已{effective_vote}",
            })

        await self.db.commit()
        return {"results": results, "total": len(review_ids)}

    # ------------------------------------------------------------------
    # 审核升级
    # ------------------------------------------------------------------

    async def escalate(self, review_id: str, reason: str) -> dict:
        """升级审核任务（创建遗留问题）。

        Args:
            review_id: 审核任务 ID。
            reason: 升级原因。

        Returns:
            dict: 升级结果。
        """
        task_result = await self.db.execute(
            text("SELECT * FROM review_tasks WHERE id = :id"),
            {"id": review_id},
        )
        task = task_result.fetchone()
        if task is None:
            raise AppException(ErrorCode.NOT_FOUND, "审核任务不存在", status_code=404)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # 更新审核任务状态为 escalated
        await self.db.execute(
            text(
                "UPDATE review_tasks SET status = 'escalated', updated_at = :updated_at "
                "WHERE id = :id"
            ),
            {"id": review_id, "updated_at": now},
        )

        # 创建遗留问题
        issue_id = generate_issue_id()
        await self.db.execute(
            text(
                "INSERT INTO review_issues (id, project_id, gate_id, description, status, created_at) "
                "VALUES (:id, :project_id, :gate_id, :description, :status, :created_at)"
            ),
            {
                "id": issue_id,
                "project_id": task.project_id,
                "gate_id": task.gate_id,
                "description": reason,
                "status": "open",
                "created_at": now,
            },
        )

        await self.db.commit()

        return {
            "review_id": review_id,
            "issue_id": issue_id,
            "status": "escalated",
            "reason": reason,
            "created_at": now,
        }

    # ------------------------------------------------------------------
    # 仪表盘聚合数据
    # ------------------------------------------------------------------

    async def get_dashboard(self) -> dict:
        """获取审核仪表盘聚合数据。

        Returns:
            dict: 包含审核统计、状态分布、近期活动等。
        """
        # 审核任务总数
        total_result = await self.db.execute(
            text("SELECT COUNT(*) as total FROM review_tasks")
        )
        total = total_result.fetchone().total

        # 按状态统计
        status_result = await self.db.execute(
            text(
                "SELECT status, COUNT(*) as count FROM review_tasks GROUP BY status"
            )
        )
        status_counts = {row.status: row.count for row in status_result.fetchall()}

        # 遗留问题数量
        open_issues_result = await self.db.execute(
            text("SELECT COUNT(*) as count FROM review_issues WHERE status = 'open'")
        )
        open_issues = open_issues_result.fetchone().count

        resolved_issues_result = await self.db.execute(
            text("SELECT COUNT(*) as count FROM review_issues WHERE status = 'resolved'")
        )
        resolved_issues = resolved_issues_result.fetchone().count

        # 近期投票记录（最近 10 条）
        recent_votes_result = await self.db.execute(
            text(
                "SELECT * FROM gate_results ORDER BY created_at DESC LIMIT 10"
            )
        )
        recent_votes = [
            {
                "id": row.id,
                "project_id": row.project_id,
                "gate_id": row.gate_id,
                "vote": row.vote,
                "voter_role": row.voter_role,
                "is_auto_approved": bool(row.is_auto_approved),
                "created_at": row.created_at,
            }
            for row in recent_votes_result.fetchall()
        ]

        return {
            "total_reviews": total,
            "status_breakdown": status_counts,
            "open_issues": open_issues,
            "resolved_issues": resolved_issues,
            "total_issues": open_issues + resolved_issues,
            "recent_votes": recent_votes,
            "mode": "single_user" if self.SINGLE_USER_MODE else "multi_user",
        }

    # ------------------------------------------------------------------
    # 遗留问题列表
    # ------------------------------------------------------------------

    async def get_issues(self, project_id: str | None = None) -> dict:
        """获取遗留问题列表。

        Args:
            project_id: 可选，按项目过滤。

        Returns:
            dict: 包含遗留问题列表。
        """
        query = "SELECT * FROM review_issues WHERE 1=1"
        params: dict = {}

        if project_id:
            query += " AND project_id = :project_id"
            params["project_id"] = project_id

        query += " ORDER BY created_at DESC"

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()

        return {
            "items": [
                {
                    "id": row.id,
                    "project_id": row.project_id,
                    "gate_id": row.gate_id,
                    "description": row.description,
                    "status": row.status,
                    "created_at": row.created_at,
                    "resolved_at": row.resolved_at,
                }
                for row in rows
            ],
            "total": len(rows),
        }