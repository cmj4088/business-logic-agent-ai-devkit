"""用量追踪业务逻辑 — M9。

处理项目用量统计、全局摘要、每日趋势、用量限制和预算检查。
"""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 模型单价（每 100 万 Token，单位：美元）
# 格式: (input 单价, output 单价)
MODEL_PRICING: dict[str, tuple[float, float]] = {
    # Ollama 本地模型：免费
    "ollama": (0.0, 0.0),
    "qwen2.5": (0.0, 0.0),
    "llama3.2": (0.0, 0.0),
    "deepseek-r1": (0.0, 0.0),
    # Anthropic Claude Sonnet
    "claude-sonnet-4-5": (3.00, 15.00),
    "claude-haiku-4-5": (0.80, 4.00),
    # OpenAI GPT-4o
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
}


def _get_model_pricing(model: str) -> tuple[float, float]:
    """根据模型名称获取定价，未知模型默认按轻量付费模型计算。"""
    model_lower = model.lower()
    # 精确匹配
    if model_lower in MODEL_PRICING:
        return MODEL_PRICING[model_lower]
    # 模糊匹配：Ollama 系列免费
    if any(kw in model_lower for kw in ("ollama", "qwen", "llama", "deepseek", "mistral", "phi")):
        return (0.0, 0.0)
    # Claude 系列
    if "claude" in model_lower or "sonnet" in model_lower or "haiku" in model_lower:
        return (3.00, 15.00)
    # GPT 系列
    if "gpt" in model_lower or "4o" in model_lower:
        return (2.50, 10.00)
    # 默认：轻量付费模型
    return (0.50, 2.00)


def _calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """根据模型和 Token 数计算成本（美元）。"""
    input_price, output_price = _get_model_pricing(model)
    input_cost = (input_tokens / 1_000_000) * input_price
    output_cost = (output_tokens / 1_000_000) * output_price
    return round(input_cost + output_cost, 6)


class UsageService:
    """用量追踪服务。"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- 项目用量统计 ----

    async def get_project_usage(self, project_id: str) -> dict:
        """获取项目用量统计（总 Token、成本、按模型分布）。

        返回:
            dict: {
                "project_id": str,
                "total_tokens": int,
                "total_input_tokens": int,
                "total_output_tokens": int,
                "total_cost": float,
                "record_count": int,
                "by_model": [
                    {"model": str, "tokens": int, "cost": float, "count": int},
                    ...
                ]
            }
        """
        # 按模型聚合
        result = await self.db.execute(
            text("""
                SELECT
                    model,
                    SUM(input_tokens) AS total_input,
                    SUM(output_tokens) AS total_output,
                    SUM(input_tokens + output_tokens) AS total_tokens,
                    SUM(cost_usd) AS total_cost,
                    COUNT(*) AS record_count
                FROM usage_records
                WHERE project_id = :project_id
                GROUP BY model
                ORDER BY total_tokens DESC
            """),
            {"project_id": project_id}
        )
        rows = result.fetchall()

        if not rows:
            return {
                "project_id": project_id,
                "total_tokens": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "total_cost": 0.0,
                "record_count": 0,
                "by_model": [],
            }

        by_model = []
        total_tokens = 0
        total_input = 0
        total_output = 0
        total_cost = 0.0
        total_count = 0

        for row in rows:
            tokens = row.total_tokens or 0
            cost = row.total_cost or 0.0
            count = row.record_count or 0
            by_model.append({
                "model": row.model,
                "tokens": tokens,
                "input_tokens": row.total_input or 0,
                "output_tokens": row.total_output or 0,
                "cost": round(cost, 6),
                "count": count,
            })
            total_tokens += tokens
            total_input += row.total_input or 0
            total_output += row.total_output or 0
            total_cost += cost
            total_count += count

        return {
            "project_id": project_id,
            "total_tokens": total_tokens,
            "total_input_tokens": total_input,
            "total_output_tokens": total_output,
            "total_cost": round(total_cost, 6),
            "record_count": total_count,
            "by_model": by_model,
        }

    # ---- 全局用量摘要 ----

    async def get_summary(self) -> dict:
        """获取全局用量摘要。

        返回:
            dict: {
                "total_tokens": int,
                "total_input_tokens": int,
                "total_output_tokens": int,
                "total_cost": float,
                "total_records": int,
                "active_projects": int,
                "period": str,
            }
        """
        # 全局聚合
        result = await self.db.execute(
            text("""
                SELECT
                    COALESCE(SUM(input_tokens), 0) AS total_input,
                    COALESCE(SUM(output_tokens), 0) AS total_output,
                    COALESCE(SUM(input_tokens + output_tokens), 0) AS total_tokens,
                    COALESCE(SUM(cost_usd), 0) AS total_cost,
                    COUNT(*) AS total_records
                FROM usage_records
            """)
        )
        row = result.fetchone()

        # 活跃项目数（有用量记录的项目）
        active_result = await self.db.execute(
            text("""
                SELECT COUNT(DISTINCT project_id) AS active_projects
                FROM usage_records
            """)
        )
        active_row = active_result.fetchone()

        return {
            "total_tokens": row.total_tokens or 0,
            "total_input_tokens": row.total_input or 0,
            "total_output_tokens": row.total_output or 0,
            "total_cost": round(row.total_cost or 0.0, 6),
            "total_records": row.total_records or 0,
            "active_projects": active_row.active_projects or 0,
            "period": "monthly",
        }

    # ---- 每日趋势 ----

    async def get_daily_trend(self, days: int = 30) -> list[dict]:
        """获取每日用量趋势。

        参数:
            days: 回溯天数，默认 30。

        返回:
            list[dict]: 每日用量数据列表。
        """
        result = await self.db.execute(
            text("""
                SELECT
                    DATE(created_at) AS date,
                    COALESCE(SUM(input_tokens), 0) AS total_input,
                    COALESCE(SUM(output_tokens), 0) AS total_output,
                    COALESCE(SUM(input_tokens + output_tokens), 0) AS total_tokens,
                    COALESCE(SUM(cost_usd), 0) AS total_cost,
                    COUNT(*) AS record_count
                FROM usage_records
                WHERE created_at >= DATE('now', :days_offset)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            """),
            {"days_offset": f"-{days} days"}
        )
        rows = result.fetchall()

        trend = []
        for row in rows:
            trend.append({
                "date": row.date,
                "total_tokens": row.total_tokens or 0,
                "total_input_tokens": row.total_input or 0,
                "total_output_tokens": row.total_output or 0,
                "total_cost": round(row.total_cost or 0.0, 6),
                "record_count": row.record_count or 0,
            })

        return trend

    # ---- 用量限制 ----

    async def get_limits(self) -> dict:
        """获取当前的用量限制配置。

        返回:
            dict: {
                "limits": [{"id": str, "max_tokens": int, "period": str, "is_active": bool}, ...]
            }
        """
        result = await self.db.execute(
            text("""
                SELECT id, limit_type, max_tokens, period, is_active, created_at
                FROM usage_limits
                ORDER BY created_at DESC
            """)
        )
        rows = result.fetchall()

        limits = []
        for row in rows:
            limits.append({
                "id": row.id,
                "limit_type": row.limit_type,
                "max_tokens": row.max_tokens,
                "period": row.period,
                "is_active": bool(row.is_active),
                "created_at": row.created_at,
            })

        return {"limits": limits}

    async def update_limits(self, max_tokens: int, period: str = "monthly", is_active: bool = True) -> dict:
        """更新用量限制。

        参数:
            max_tokens: 最大 Token 数。
            period: 限制周期（daily/monthly）。
            is_active: 是否启用。

        返回:
            dict: 更新后的限制配置。
        """
        limit_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        await self.db.execute(
            text("""
                INSERT INTO usage_limits (id, limit_type, max_tokens, period, is_active, created_at)
                VALUES (:id, :limit_type, :max_tokens, :period, :is_active, :created_at)
            """),
            {
                "id": limit_id,
                "limit_type": "token",
                "max_tokens": max_tokens,
                "period": period,
                "is_active": 1 if is_active else 0,
                "created_at": now,
            }
        )
        await self.db.commit()

        return {
            "id": limit_id,
            "limit_type": "token",
            "max_tokens": max_tokens,
            "period": period,
            "is_active": is_active,
            "created_at": now,
        }

    # ---- 预算检查 ----

    async def check_budget(self, project_id: str) -> dict:
        """检查项目预算（80% 提醒，100% 阻止）。

        返回:
            dict: {
                "project_id": str,
                "budget_limit": float,
                "total_cost": float,
                "usage_percent": float,
                "status": "ok" | "warning" | "blocked",
                "message": str,
            }
        """
        # 查询项目预算限制
        result = await self.db.execute(
            text("SELECT budget_limit, name FROM projects WHERE id = :project_id"),
            {"project_id": project_id}
        )
        project = result.fetchone()
        if project is None:
            return {
                "project_id": project_id,
                "budget_limit": 0,
                "total_cost": 0,
                "usage_percent": 0,
                "status": "ok",
                "message": "项目不存在",
            }

        budget_limit = project.budget_limit or 0

        # 查询项目总花费
        cost_result = await self.db.execute(
            text("""
                SELECT COALESCE(SUM(cost_usd), 0) AS total_cost
                FROM usage_records
                WHERE project_id = :project_id
            """),
            {"project_id": project_id}
        )
        cost_row = cost_result.fetchone()
        total_cost = cost_row.total_cost or 0.0

        # 计算百分比
        if budget_limit <= 0:
            usage_percent = 0.0
            status = "ok"
            message = "项目未设置预算限制"
        else:
            usage_percent = round((total_cost / budget_limit) * 100, 2)
            if usage_percent >= 100:
                status = "blocked"
                message = f"预算已耗尽！当前花费 ${total_cost:.2f}，预算上限 ${budget_limit:.2f}"
            elif usage_percent >= 80:
                status = "warning"
                message = f"预算使用已达 {usage_percent:.1f}%，当前花费 ${total_cost:.2f}，预算上限 ${budget_limit:.2f}"
            else:
                status = "ok"
                message = f"预算使用正常，当前花费 ${total_cost:.2f}，预算上限 ${budget_limit:.2f}"

        return {
            "project_id": project_id,
            "budget_limit": budget_limit,
            "total_cost": round(total_cost, 6),
            "usage_percent": usage_percent,
            "status": status,
            "message": message,
        }