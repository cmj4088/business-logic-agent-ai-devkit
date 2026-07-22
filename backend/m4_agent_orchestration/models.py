"""Pydantic 模型 — M4 Agent 编排。"""
from pydantic import BaseModel, Field
from typing import Optional
from shared.types import OrchestrationMode, AgentRole


class OrchestrateRequest(BaseModel):
    """Agent 编排请求。"""
    project_id: str = Field(..., description="项目 ID")
    stage: str = Field(..., description="当前阶段")
    activity_key: str = Field(..., description="活动标识")
    mode: OrchestrationMode = Field(default=OrchestrationMode.SEQUENTIAL, description="编排模式")
    agents: list[str] = Field(..., description="参与的 Agent 角色列表")
    user_input: str = Field(default="", description="用户附加上下文")
    max_rounds: int = Field(default=3, ge=1, le=10, description="最大辩论轮次")


class AgentConfigRequest(BaseModel):
    """Agent 配置请求。"""
    role: str = Field(..., description="Agent 角色")
    model: str = Field(default="ollama", description="使用的模型")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: int = Field(default=32000, ge=1024, le=128000, description="最大 Token 数")


class ModelTestRequest(BaseModel):
    """模型测试请求。"""
    model: str = Field(default="deepseek-chat", description="模型名称")
    provider: str = Field(default="deepseek", description="提供商（deepseek/ollama/anthropic/openai）")


class SkillExecuteRequest(BaseModel):
    """Skill 执行请求。"""
    tool_name: str = Field(..., description="工具名称（如 analyze_data, generate_xlsx, generate_docx）")
    project_id: str = Field(..., description="项目 ID")
    stage: str = Field(..., description="当前阶段")
    activity_key: str = Field(default="", description="活动标识")
    agent_role: str = Field(default="user", description="发起角色")
    params: dict = Field(default_factory=dict, description="工具参数（与 tool_schema 中一致）")
    user_input: str = Field(default="", description="用户附加上下文")