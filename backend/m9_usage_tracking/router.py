"""用量追踪路由 — M9。

提供项目用量、全局摘要、每日趋势、用量限制和预算检查等 API 端点。
"""
from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from .models import UsageLimitUpdate
from .usage_service import UsageService

router = APIRouter(prefix="/api/usage", tags=["用量"])


@router.get("/projects/{project_id}")
async def get_project_usage(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取项目用量统计（总 Token、成本、按模型分布）。"""
    service = UsageService(db)
    data = await service.get_project_usage(project_id)
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/summary")
async def get_summary(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取全局用量摘要。"""
    service = UsageService(db)
    data = await service.get_summary()
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/daily")
async def get_daily_trend(
    days: int = Query(default=30, ge=1, le=365, description="回溯天数"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取每日用量趋势。"""
    service = UsageService(db)
    data = await service.get_daily_trend(days=days)
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/limits")
async def get_limits(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用量限制配置。"""
    service = UsageService(db)
    data = await service.get_limits()
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.put("/limits")
async def update_limits(
    request: UsageLimitUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新用量限制配置。"""
    service = UsageService(db)
    data = await service.update_limits(
        max_tokens=request.max_tokens,
        period=request.period,
        is_active=request.is_active,
    )
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/projects/{project_id}/budget")
async def check_budget(
    project_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """检查项目预算（80% 提醒，100% 阻止）。"""
    service = UsageService(db)
    data = await service.check_budget(project_id)
    return {"data": data, "error": None, "meta": {"request_id": ""}}


# === 前端兼容别名端点 ===


@router.get("/overview")
async def get_overview(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用量概览（前端兼容别名 GET /api/usage/overview）。"""
    service = UsageService(db)
    data = await service.get_summary()
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/projects")
async def list_project_usage(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取所有项目用量列表（前端兼容别名 GET /api/usage/projects）。"""
    from sqlalchemy import text
    result = await db.execute(
        text("""SELECT p.id, p.name,
                COALESCE(SUM(u.input_tokens + u.output_tokens), 0) as total_tokens,
                COALESCE(SUM(u.cost_usd), 0.0) as total_cost
                FROM projects p
                LEFT JOIN usage_records u ON p.id = u.project_id
                WHERE p.deleted_at IS NULL
                GROUP BY p.id, p.name
                ORDER BY total_tokens DESC""")
    )
    projects = []
    for row in result.fetchall():
        projects.append({
            "projectId": row.id,
            "projectName": row.name,
            "totalTokens": row.total_tokens,
            "totalCostUSD": round(row.total_cost, 2),
        })
    return {"data": projects, "error": None, "meta": {"request_id": ""}}


@router.get("/daily-trends")
async def get_daily_trends(
    days: int = Query(default=30, ge=1, le=365, description="回溯天数"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取每日用量趋势（前端兼容别名 GET /api/usage/daily-trends）。"""
    service = UsageService(db)
    data = await service.get_daily_trend(days=days)
    return {"data": data, "error": None, "meta": {"request_id": ""}}


@router.get("/budget-alerts")
async def get_budget_alerts(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取预算预警配置（前端兼容别名 GET /api/usage/budget-alerts）。"""
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT * FROM settings WHERE key LIKE 'budget_%'")
    )
    alerts = {}
    for row in result.fetchall():
        alerts[row.key] = row.value
    return {
        "data": {
            "dailyLimit": float(alerts.get("budget_daily_limit", 50)),
            "monthlyLimit": float(alerts.get("budget_monthly_limit", 1000)),
            "alertThreshold": float(alerts.get("budget_alert_threshold", 0.8)),
            "isEnabled": alerts.get("budget_enabled", "true") == "true",
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.put("/budget-alerts")
async def update_budget_alerts(
    dailyLimit: float = Body(50, embed=True),
    monthlyLimit: float = Body(1000, embed=True),
    alertThreshold: float = Body(0.8, embed=True),
    isEnabled: bool = Body(True, embed=True),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新预算预警配置（前端兼容别名 PUT /api/usage/budget-alerts）。"""
    from sqlalchemy import text
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    updates = {
        "budget_daily_limit": str(dailyLimit),
        "budget_monthly_limit": str(monthlyLimit),
        "budget_alert_threshold": str(alertThreshold),
        "budget_enabled": str(isEnabled).lower(),
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
            "dailyLimit": dailyLimit,
            "monthlyLimit": monthlyLimit,
            "alertThreshold": alertThreshold,
            "isEnabled": isEnabled,
        },
        "error": None,
        "meta": {"request_id": ""},
    }