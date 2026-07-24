"""Pydantic 请求/响应模型 — M2 工作流引擎。"""
from pydantic import BaseModel, Field
from typing import Optional
from shared.types import IPDStage, ComplexityTier


class ProjectCreateRequest(BaseModel):
    """创建项目请求。"""
    name: str = Field(..., min_length=2, max_length=50, description="产品名称")
    template_id: str = Field(default="standard_ipd_v3", description="模板 ID")
    target_weeks: int = Field(..., ge=1, le=52, description="预计周数")
    team_size: int = Field(..., ge=1, le=1000, description="团队规模")
    budget_limit: float = Field(..., ge=0, description="预算上限（美元）")
    industry: str = Field(default="其他", description="行业类型")
    description: str = Field(default="", description="项目描述")


class ProjectResponse(BaseModel):
    """项目响应。"""
    id: str
    name: str
    description: str
    complexity_tier: ComplexityTier
    current_stage: IPDStage
    status: str
    progress: float
    template_id: str
    budget_limit: float
    team_size: int
    target_weeks: int
    industry: str
    created_at: str
    updated_at: str


class StageDetail(BaseModel):
    """阶段详情。"""
    stage: IPDStage
    status: str
    activities: list[dict] = Field(default_factory=list)
    gates: list[dict] = Field(default_factory=list)
    widgets: dict = Field(default_factory=dict)