"""工作流引擎路由 — M2。"""
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from shared.types import IPDStage, OrchestrationMode
from .models import ProjectCreateRequest
from .engine import WorkflowEngine, STAGE_ORDER, DEFAULT_ACTIVITIES, STAGE_GATES, EXIT_CRITERIA, ACTIVITY_AGENT_MAP

router = APIRouter(prefix="/api", tags=["工作流"])


@router.get("/projects")
async def list_projects(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    result = await engine.list_projects(user["id"], status, page, page_size)
    return {"data": result, "error": None, "meta": {"request_id": "", "page": page, "page_size": page_size, "total": result["total"]}}


@router.post("/projects")
async def create_project(
    request: ProjectCreateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    project = await engine.create_project(user["id"], request)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    project = await engine.get_project(project_id)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/advance")
async def advance_stage(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    project = await engine.advance_stage(project_id)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/rollback")
async def rollback_stage(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    project = await engine.rollback_stage(project_id)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/stages/{stage}")
async def get_stage_detail(
    project_id: str,
    stage: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = WorkflowEngine(db)
    detail = await engine.get_stage_detail(project_id, stage)
    return {"data": detail, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/stages")
async def get_stages(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目所有阶段概览。"""
    result = await db.execute(
        text("SELECT * FROM stage_states WHERE project_id = :project_id ORDER BY created_at"),
        {"project_id": project_id}
    )
    stages = []
    for row in result.fetchall():
        stages.append({
            "id": row.id, "stage": row.stage, "status": row.status,
            "started_at": row.started_at, "completed_at": row.completed_at,
        })
    return {"data": stages, "error": None, "meta": {"request_id": ""}}


@router.get("/workflows/stages")
async def get_stage_info():
    """获取 IPD 阶段和门禁的定义信息（供前端参考）。"""
    return {
        "data": {
            "stages": [s.value for s in STAGE_ORDER],
            "gates": {k.value: v for k, v in STAGE_GATES.items()},
            "criteria": EXIT_CRITERIA,
        },
        "error": None,
        "meta": {"request_id": ""},
    }


# === M14b 项目详情页新增端点 ===


@router.get("/projects/{project_id}/stage")
async def get_current_stage(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目当前阶段详情（活动 + 门禁 + 小组件）。"""
    engine = WorkflowEngine(db)
    detail = await engine.get_current_stage_detail(project_id)
    return {"data": detail, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/activities")
async def get_activities(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前阶段活动列表。"""
    engine = WorkflowEngine(db)
    activities = await engine.get_activities(project_id)
    return {"data": activities, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/gates")
async def get_gates(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前阶段门禁状态。"""
    engine = WorkflowEngine(db)
    gates = await engine.get_gates(project_id)
    return {"data": gates, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/pause")
async def pause_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """暂停项目。"""
    engine = WorkflowEngine(db)
    project = await engine.pause_project(project_id)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/resume")
async def resume_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """恢复已暂停的项目。"""
    engine = WorkflowEngine(db)
    project = await engine.resume_project(project_id)
    return {"data": project, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/gates/{gate_id}/vote")
async def submit_gate_vote(
    project_id: str,
    gate_id: str,
    vote: str = Body("approve", embed=True),
    comment: str = Body("", embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交门禁投票。"""
    engine = WorkflowEngine(db)
    voter_role = user.get("role", "reviewer")
    result = await engine.submit_gate_vote(
        project_id=project_id,
        gate_id=gate_id,
        voter_role=voter_role,
        vote=vote,
        comment=comment,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}


# ============================================================
# 活动操作 + 消息端点（核心 Agent 调用链路）
# ============================================================


@router.post("/projects/{project_id}/activities/{activity_id}/action")
async def perform_activity_action(
    project_id: str,
    activity_id: str,
    action: str = Body(..., embed=True),
    human_input: str = Body("", embed=True),
    bypass_option: str = Body("skip_once", embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """执行活动操作。

    action=start: 自动触发 Agent 编排，完成后创建产出物
    action=complete: 标记活动完成
    action=skip: 跳过活动
    action=bypass: 旁路活动
    """
    engine = WorkflowEngine(db)

    if action == "skip":
        activity = await engine.skip_activity(project_id, activity_id)
        return {"data": activity, "error": None, "meta": {"request_id": ""}}

    if action == "bypass":
        activity = await engine.bypass_activity(project_id, activity_id, bypass_option)
        return {"data": activity, "error": None, "meta": {"request_id": ""}}

    if action == "complete":
        activity = await engine.complete_activity(project_id, activity_id)
        return {"data": activity, "error": None, "meta": {"request_id": ""}}

    if action != "start":
        from shared.errors import AppException, ErrorCode
        raise AppException(ErrorCode.VALIDATION_ERROR, f"未知操作: {action}", status_code=422)

    # --- action="start": 触发 Agent 编排 ---
    # 1. 更新活动状态为 in_progress
    activity = await engine.start_activity(project_id, activity_id)

    # 2. 获取活动 key 和项目信息
    project = await engine.get_project(project_id)
    stage = project["currentStage"]
    activity_key = activity.get("key", "")

    # 3. 查找活动对应的 Agent 配置
    agent_config = ACTIVITY_AGENT_MAP.get(activity_key)
    if agent_config is None:
        # 没有对应映射，直接标记完成
        activity = await engine.complete_activity(project_id, activity_id)
        return {"data": activity, "error": None, "meta": {"request_id": ""}}

    agents = agent_config["agents"]
    mode = OrchestrationMode(agent_config["mode"])
    artifact_type = agent_config["artifact_type"]
    artifact_name = agent_config["artifact_name"]

    # 4. 保存用户输入消息（如有）
    if human_input.strip():
        await engine.send_message(
            project_id=project_id,
            sender="human",
            content=human_input,
            message_type="query",
            stage=stage,
        )

    # 5. 调用 M4 Orchestrator 进行编排
    from m4_agent_orchestration.orchestrator import Orchestrator
    orchestrator = Orchestrator(db, user_id=user["id"])
    try:
        result = await orchestrator.orchestrate(
            project_id=project_id,
            stage=stage,
            activity_key=activity_key,
            mode=mode,
            agents=agents,
            user_input=human_input,
        )
    except Exception as e:
        # 编排失败，活动保持 in_progress 状态，返回错误
        return {
            "data": activity,
            "error": {"code": "LLM_ERROR", "message": f"Agent 编排失败: {str(e)}"},
            "meta": {"request_id": ""},
        }

    # 6. 将 Agent 输出保存为消息
    round_id = result.get("round_id", "")
    for output in result.get("outputs", []):
        role = output.get("role", "agent")
        content = output.get("content", "")
        if content:
            await engine.send_message(
                project_id=project_id,
                sender=role,
                content=content,
                message_type="response",
                round_id=round_id,
                stage=stage,
                metadata={"model": output.get("model", ""), "provider": output.get("provider", "")},
            )

    # 7. 创建产出物（合并所有 Agent 输出）
    combined_content = _build_artifact_content(result, artifact_name, agents)
    from m5_artifact_management.artifact_service import ArtifactService
    artifact_service = ArtifactService(db)
    try:
        artifact = await artifact_service.create_artifact(
            project_id=project_id,
            artifact_type=artifact_type,
            name=artifact_name,
            content=combined_content,
            stage=stage,
            ai_metadata={
                "round_id": round_id,
                "mode": result.get("mode", ""),
                "agents": agents,
                "tokens": result.get("tokens", {}),
            },
        )
    except Exception:
        artifact = None

    # 8. 标记活动完成
    activity = await engine.complete_activity(project_id, activity_id)

    # 9. 返回活动状态 + 编排结果摘要
    return {
        "data": {
            **activity,
            "orchestration": {
                "round_id": round_id,
                "mode": result.get("mode", ""),
                "agent_count": len(agents),
                "summary": result.get("summary", ""),
                "tokens": result.get("tokens", {}),
                "artifact_id": artifact["id"] if artifact else None,
            },
        },
        "error": None,
        "meta": {"request_id": ""},
    }


def _build_artifact_content(result: dict, artifact_name: str, agents: list[str]) -> str:
    """将编排结果组装为产出物内容（Markdown 格式）。"""
    lines = [f"# {artifact_name}\n"]
    summary = result.get("summary", "")
    if summary:
        lines.append(f"## 摘要\n\n{summary}\n")

    for output in result.get("outputs", []):
        role = output.get("role_name", output.get("role", "Agent"))
        content = output.get("content", "")
        lines.append(f"## {role}\n\n{content}\n")

    tokens = result.get("tokens", {})
    if tokens:
        lines.append(f"\n---\n*Token 消耗: 输入 {tokens.get('input', 0)}, 输出 {tokens.get('output', 0)}*")

    return "\n".join(lines)


# ============================================================
# 消息端点
# ============================================================


@router.get("/projects/{project_id}/messages")
async def get_messages(
    project_id: str,
    stage: str | None = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目消息历史。"""
    engine = WorkflowEngine(db)
    messages = await engine.get_messages(project_id, stage)
    return {"data": messages, "error": None, "meta": {"request_id": ""}}


@router.post("/projects/{project_id}/messages")
async def send_message(
    project_id: str,
    content: str = Body(..., embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """发送用户消息。"""
    engine = WorkflowEngine(db)
    message = await engine.send_message(
        project_id=project_id,
        sender="human",
        content=content,
        message_type="query",
    )
    return {"data": message, "error": None, "meta": {"request_id": ""}}