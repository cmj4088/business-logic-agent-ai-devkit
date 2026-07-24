"""Pydantic 请求/响应模型 — M6 审核系统。"""

from pydantic import BaseModel, Field


class VoteRequest(BaseModel):
    """投票请求。"""
    gate_id: str = Field(..., description="门禁 ID")
    vote: str = Field(..., description="approve/reject/request_changes")
    comment: str = Field(default="", description="审核意见")


class BatchReviewRequest(BaseModel):
    """批量审核请求。"""
    review_ids: list[str] = Field(..., description="批量审核 ID 列表")
    vote: str = Field(..., description="approve/reject")


class EscalateRequest(BaseModel):
    """审核升级请求。"""
    reason: str = Field(..., description="升级原因")