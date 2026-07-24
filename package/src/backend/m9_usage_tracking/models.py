"""Pydantic 模型 — M9 用量追踪。"""
from pydantic import BaseModel, Field


class UsageLimitUpdate(BaseModel):
    max_tokens: int = Field(..., ge=1, description="最大 Token 数")
    period: str = Field(default="monthly", description="daily/monthly")
    is_active: bool = Field(default=True, description="是否启用")