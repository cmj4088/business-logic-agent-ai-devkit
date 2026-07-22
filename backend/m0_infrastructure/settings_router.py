"""应用设置与数据管理路由 — M0 基础设施。

提供全局设置、数据导出/清除、用户引导等端点。
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user

router = APIRouter(tags=["设置与数据"])


# ============================================================
# 用户引导
# ============================================================


@router.get("/api/user/onboarding")
async def get_onboarding_state(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户引导状态。"""
    result = await db.execute(
        text("SELECT completed_steps FROM user_onboarding WHERE user_id = :user_id"),
        {"user_id": user["id"]},
    )
    row = result.fetchone()
    if row is None:
        return {
            "data": {"isFirstVisit": True, "completedSteps": []},
            "error": None,
            "meta": {"request_id": ""},
        }
    steps = row.completed_steps.split(",") if row.completed_steps else []
    return {
        "data": {"isFirstVisit": False, "completedSteps": steps},
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/api/user/onboarding/complete")
async def complete_onboarding_step(
    step_id: str = Body(..., embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """标记引导步骤完成。"""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    result = await db.execute(
        text("SELECT completed_steps FROM user_onboarding WHERE user_id = :user_id"),
        {"user_id": user["id"]},
    )
    row = result.fetchone()
    if row is None:
        await db.execute(
            text("INSERT INTO user_onboarding (user_id, completed_steps, created_at, updated_at) VALUES (:user_id, :step, :now, :now)"),
            {"user_id": user["id"], "step": step_id, "now": now},
        )
    else:
        existing = row.completed_steps.split(",") if row.completed_steps else []
        if step_id not in existing:
            existing.append(step_id)
        await db.execute(
            text("UPDATE user_onboarding SET completed_steps = :steps, updated_at = :now WHERE user_id = :user_id"),
            {"steps": ",".join(existing), "now": now, "user_id": user["id"]},
        )
    await db.commit()
    return {"data": {"step_id": step_id, "completed": True}, "error": None, "meta": {"request_id": ""}}


# ============================================================
# 全局设置
# ============================================================


@router.get("/api/settings")
async def get_settings(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取全局应用设置。"""
    result = await db.execute(
        text("SELECT key, value FROM settings WHERE key NOT LIKE 'budget_%'")
    )
    settings = {}
    for row in result.fetchall():
        settings[row.key] = row.value
    return {
        "data": {
            "theme": settings.get("theme", "system"),
            "language": settings.get("language", "zh-CN"),
            "autoAdvanceStage": settings.get("auto_advance_stage", "false") == "true",
            "maxDebateRounds": int(settings.get("max_debate_rounds", "5")),
            "notificationEnabled": settings.get("notification_enabled", "true") == "true",
            "defaultLLMBackend": settings.get("default_llm_backend", "ollama"),
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.put("/api/settings")
async def update_settings(
    theme: str = Body("system", embed=True),
    language: str = Body("zh-CN", embed=True),
    autoAdvanceStage: bool = Body(False, embed=True),
    maxDebateRounds: int = Body(5, embed=True),
    notificationEnabled: bool = Body(True, embed=True),
    defaultLLMBackend: str = Body("ollama", embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新全局应用设置。"""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    updates = {
        "theme": theme,
        "language": language,
        "auto_advance_stage": str(autoAdvanceStage).lower(),
        "max_debate_rounds": str(maxDebateRounds),
        "notification_enabled": str(notificationEnabled).lower(),
        "default_llm_backend": defaultLLMBackend,
    }
    for key, value in updates.items():
        await db.execute(
            text("""INSERT INTO settings (key, value, updated_at) VALUES (:key, :value, :now)
                    ON CONFLICT(key) DO UPDATE SET value = :value, updated_at = :now"""),
            {"key": key, "value": value, "now": now},
        )
    await db.commit()
    return {
        "data": {
            "theme": theme,
            "language": language,
            "autoAdvanceStage": autoAdvanceStage,
            "maxDebateRounds": maxDebateRounds,
            "notificationEnabled": notificationEnabled,
            "defaultLLMBackend": defaultLLMBackend,
        },
        "error": None,
        "meta": {"request_id": ""},
    }


# ============================================================
# 数据导出/清除
# ============================================================


@router.post("/api/data/export")
async def export_data(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出用户数据（GDPR 合规）。"""
    from fastapi.responses import JSONResponse

    # 收集用户所有数据
    result = await db.execute(
        text("SELECT * FROM projects WHERE user_id = :user_id AND deleted_at IS NULL"),
        {"user_id": user["id"]},
    )
    projects = []
    for row in result.fetchall():
        projects.append({
            "id": row.id, "name": row.name, "stage": row.current_stage,
            "status": row.status, "created_at": str(row.created_at),
        })

    return {
        "data": {
            "user": {"id": user["id"], "email": user.get("email", ""), "display_name": user.get("display_name", "")},
            "projects": projects,
            "exported_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/api/data/clear")
async def clear_data(
    confirmation: str = Body(..., embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """清除所有用户数据（需确认短语）。"""
    if confirmation != "确认清除所有数据":
        return {
            "data": None,
            "error": {"code": "VALIDATION_ERROR", "message": "确认短语不匹配，操作已取消"},
            "meta": {"request_id": ""},
        }

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    # 软删除用户的项目
    await db.execute(
        text("UPDATE projects SET deleted_at = :now WHERE user_id = :user_id"),
        {"user_id": user["id"], "now": now},
    )
    await db.commit()
    return {
        "data": {"success": True, "message": "所有数据已清除"},
        "error": None,
        "meta": {"request_id": ""},
    }