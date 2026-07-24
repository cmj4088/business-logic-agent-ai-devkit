"""Pydantic 模型 — M5 产出物管理。"""
from pydantic import BaseModel, Field
from typing import Optional


class ArtifactCreateRequest(BaseModel):
    project_id: str = Field(..., description="项目 ID")
    artifact_type: str = Field(..., description="产出物类型")
    name: str = Field(..., min_length=1, max_length=200, description="产出物名称")
    content: str = Field(default="", description="Markdown 内容")
    stage: str = Field(..., description="所属阶段")


class ArtifactUpdateRequest(BaseModel):
    content: str = Field(..., description="更新后的 Markdown 内容")
    change_summary: str = Field(default="", description="变更摘要")