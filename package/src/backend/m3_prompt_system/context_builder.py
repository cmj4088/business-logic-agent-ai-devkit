"""上下文构建器 — M3 提示词系统。

从项目、阶段、产出物中提取上下文变量，用于渲染提示词。
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def build_context(
    db: AsyncSession,
    project_id: str,
    stage: str | None = None,
    user_input: str | None = None,
) -> dict:
    """构建提示词渲染上下文。

    Args:
        db: 数据库会话。
        project_id: 项目 ID。
        stage: 当前阶段（可选）。
        user_input: 用户输入（可选）。

    Returns:
        渲染上下文字典。
    """
    context: dict = {
        "project": {},
        "stage": {},
        "artifacts": [],
        "user_input": user_input or "",
    }

    # 获取项目信息
    result = await db.execute(
        text("SELECT * FROM projects WHERE id = :id"),
        {"id": project_id}
    )
    project = result.fetchone()
    if project:
        context["project"] = {
            "name": project.name,
            "description": project.description or "",
            "complexity_tier": project.complexity_tier,
            "current_stage": project.current_stage,
            "industry": project.industry,
            "team_size": project.team_size,
            "budget_limit": project.budget_limit,
        }

    # 获取阶段信息
    target_stage = stage or (project.current_stage if project else "concept")
    context["stage"] = {
        "name": target_stage,
    }

    # 获取已有产出物
    result = await db.execute(
        text("""SELECT a.name, a.artifact_type, a.stage, a.version,
                a.ai_metadata, a.created_at
                FROM artifacts a
                WHERE a.project_id = :project_id AND a.deleted_at IS NULL
                ORDER BY a.created_at DESC LIMIT 10"""),
        {"project_id": project_id}
    )
    artifacts = result.fetchall()
    context["artifacts"] = [
        {
            "name": a.name,
            "type": a.artifact_type,
            "stage": a.stage,
            "version": a.version,
            "summary": f"v{a.version}, {a.artifact_type}",
            "created_at": a.created_at,
        }
        for a in artifacts
    ]

    return context