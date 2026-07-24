"""异常恢复路由 — M10。"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from .models import (
    RecoveryActionRequest,
    DebateResolveRequest,
    RegenerateRequest,
    ProceedWithIssuesRequest,
)
from .recovery_manager import RecoveryManager

router = APIRouter(prefix="/api/recovery", tags=["异常恢复"])


@router.get("/status")
async def get_recovery_status(
    project_id: str = Query(..., description="项目 ID"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前项目的恢复状态。

    返回项目是否处于恢复中、最近的恢复动作记录和摘要信息。
    """
    manager = RecoveryManager(db)
    result = await manager.get_recovery_status(project_id)
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/status")
async def get_recovery_status_by_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目恢复状态（前端兼容别名 GET /api/recovery/projects/{project_id}/status）。"""
    manager = RecoveryManager(db)
    result = await manager.get_recovery_status(project_id)
    # 添加前端期望的 camelCase 字段
    result["hasActiveActions"] = len(result.get("active_actions", [])) > 0
    result["activeActions"] = result.get("active_actions", [])
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/actions")
async def execute_recovery_action(
    request: RecoveryActionRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """执行恢复动作。

    支持的动作类型：
    - regenerate_artifact: 重新生成产出物
    - resolve_deadlock: 辩论死锁裁决
    - switch_model: 切换 LLM 模型
    - proceed_with_issues: 带着遗留问题前进
    - retry_stage: 重试当前阶段
    - rollback_stage: 回退到上一阶段
    - manual_intervention: 人工干预
    """
    manager = RecoveryManager(db)
    result = await manager.execute_action(
        project_id=request.params.get("project_id", ""),
        action_type=request.action_type,
        params=request.params,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/debate/{round_id}/resolve")
async def resolve_debate_deadlock(
    round_id: str,
    request: DebateResolveRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """辩论死锁裁决。

    裁决方式：
    - moderator_decide: 主持人做出最终裁决
    - restart: 重新开始辩论
    - proceed: 忽略死锁继续推进
    """
    manager = RecoveryManager(db)
    result = await manager.resolve_debate_deadlock(
        round_id=round_id,
        resolution=request.resolution,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/regenerate/{artifact_id}")
async def regenerate_artifact(
    artifact_id: str,
    request: RegenerateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """重新生成产出物。

    将当前版本保存到 artifact_versions 表，递增版本号。
    实际重新生成由 M4 Agent 编排模块负责。
    """
    manager = RecoveryManager(db)
    result = await manager.regenerate_artifact(
        artifact_id=artifact_id,
        temperature=request.temperature,
        model=request.model,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/proceed-with-issues")
async def proceed_with_issues(
    request: ProceedWithIssuesRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """带着遗留问题前进。

    将门禁中未解决的问题标记为"已接受(遗留)"，
    允许项目继续推进但记录风险。
    """
    manager = RecoveryManager(db)
    result = await manager.proceed_with_issues(
        project_id=request.project_id,
        gate_id=request.gate_id,
        accepted_issue_ids=request.accepted_issue_ids,
        reason=request.reason,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}