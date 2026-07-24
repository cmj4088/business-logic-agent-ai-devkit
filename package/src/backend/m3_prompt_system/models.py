"""Pydantic 模型 — M3 提示词系统。"""
from pydantic import BaseModel, Field
from typing import Optional


class RenderRequest(BaseModel):
    """提示词渲染请求。"""
    role: str = Field(..., description="Agent 角色（product_manager/rd/qa/marketing/manufacturing/finance）")
    project_context: dict = Field(default_factory=dict, description="项目上下文变量")


class TemplateUpdateRequest(BaseModel):
    """模板更新请求。"""
    content: str = Field(..., description="Jinja2 模板内容")
    version: str = Field(default="1.0", description="版本号")


class TemplateResponse(BaseModel):
    """模板响应。"""
    role: str
    name: str
    content: str
    version: str
    updated_at: str