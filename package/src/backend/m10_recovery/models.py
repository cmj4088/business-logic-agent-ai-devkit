"""Pydantic 请求/响应模型 — M10 异常恢复。"""

from typing import Optional
from pydantic import BaseModel, Field


class RecoveryActionRequest(BaseModel):
    """恢复动作请求。"""
    action_type: str = Field(..., description="恢复动作类型")
    params: dict = Field(default_factory=dict, description="动作参数")


class DebateResolveRequest(BaseModel):
    """辩论死锁裁决请求。"""
    round_id: str = Field(..., description="辩论轮次 ID")
    resolution: str = Field(..., description="moderator_decide/restart/proceed")


class RegenerateRequest(BaseModel):
    """重新生成产出物请求。"""
    artifact_id: str = Field(..., description="产出物 ID")
    temperature: float = Field(default=0.9, ge=0.0, le=2.0, description="重试温度")
    model: str = Field(default="ollama", description="使用的模型")


class ProceedWithIssuesRequest(BaseModel):
    """带着遗留问题前进请求。"""
    project_id: str = Field(..., description="项目 ID")
    gate_id: str = Field(..., description="门禁 ID")
    reason: str = Field(default="", description="决策理由")
    accepted_issue_ids: list[str] = Field(
        default_factory=list, description="接受的问题 ID 列表"
    )


class RecoveryStatusResponse(BaseModel):
    """恢复状态响应。"""
    project_id: str = Field(..., description="项目 ID")
    status: str = Field(..., description="正常/恢复中/已恢复")
    active_actions: list[dict] = Field(
        default_factory=list, description="进行中的恢复动作"
    )
    recent_actions: list[dict] = Field(
        default_factory=list, description="最近的恢复动作"
    )
    summary: dict = Field(default_factory=dict, description="恢复摘要")