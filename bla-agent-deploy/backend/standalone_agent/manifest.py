"""Agent Manifest — 独立智能体清单定义。

定义了一个独立部署的 Agent 的自描述格式，类似插件系统的 manifest.json。
包含 Agent 的身份、能力、连接方式等信息。
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AgentCapability(BaseModel):
    """Agent 能力声明。"""
    # 适用阶段（如 concept, plan, develop, verify, launch, lifecycle）
    applicable_stages: list[str] = Field(default_factory=list, description="适用阶段列表")
    # 适用活动（如 mrd_writing, system_design, test_planning）
    applicable_activities: list[str] | None = Field(default=None, description="适用活动列表")
    # 能力描述
    description: str = Field(default="", description="能力描述")
    # 支持的输出类型（如 mrd, prd, test_case, bom）
    output_types: list[str] = Field(default_factory=list, description="支持的输出类型")
    # 最大上下文长度（token）
    max_context_length: int = Field(default=128000, description="最大上下文 Token 数")


class AgentManifest(BaseModel):
    """Agent 清单 — 自描述元数据。"""
    # 唯一标识
    id: str = Field(..., description="Agent 唯一标识（如 product_manager）")
    # 显示名称
    name: str = Field(..., description="Agent 显示名称")
    # 角色类型
    role: str = Field(..., description="角色类型（product_manager/rd/qa/marketing/manufacturing/finance）")
    # 版本号
    version: str = Field(default="1.0.0", description="语义化版本号")
    # 描述
    description: str = Field(default="", description="功能描述")
    # 作者信息
    author: dict | None = Field(default=None, description="作者信息")
    # 图标（base64 或 URL）
    icon: str | None = Field(default=None, description="图标 URL 或 base64")
    # 连接地址
    url: str | None = Field(default=None, description="Agent 服务 URL（运行时配置）")
    # 健康检查端点
    health_endpoint: str = Field(default="/health", description="健康检查路径")
    # 推理端点
    infer_endpoint: str = Field(default="/infer", description="推理调用路径")
    # 令牌认证
    api_key: str | None = Field(default=None, description="API Key（可选）")
    # 能力声明
    capabilities: AgentCapability = Field(default_factory=AgentCapability, description="能力声明")
    # 支持的模型
    supported_models: list[str] = Field(default_factory=lambda: ["ollama", "deepseek", "anthropic", "openai"],
                                        description="支持的 LLM 模型列表")
    # 默认模型
    default_model: str = Field(default="ollama", description="默认使用的模型")
    # 引擎兼容性
    min_engine_version: str = Field(default="1.0.0", description="最低引擎版本")
    # 注册时间
    registered_at: str | None = Field(default=None, description="注册时间")
    # 最近活跃时间
    last_active_at: str | None = Field(default=None, description="最近活跃时间")
    # 是否在线
    is_online: bool = Field(default=False, description="是否在线")


class AgentInferRequest(BaseModel):
    """Agent 推理请求。"""
    # 系统提示词（由引擎构建）
    system_prompt: str = Field(..., description="系统提示词")
    # 用户消息
    user_message: str = Field(default="", description="用户输入消息")
    # 对话历史
    messages: list[dict] | None = Field(default=None, description="对话历史")
    # 模型参数
    model: str | None = Field(default=None, description="指定模型")
    temperature: float | None = Field(default=None, description="温度参数")
    max_tokens: int | None = Field(default=None, description="最大输出 Token 数")
    # 输出格式
    output_format: str | None = Field(default=None, description="输出格式（json/text）")
    # 上下文
    context: dict | None = Field(default=None, description="额外上下文")


class AgentInferResponse(BaseModel):
    """Agent 推理响应。"""
    content: str = Field(..., description="生成内容")
    model: str = Field(default="", description="使用的模型")
    provider: str = Field(default="", description="使用的提供商")
    tokens: dict = Field(default_factory=lambda: {"input": 0, "output": 0}, description="Token 用量")
    metadata: dict | None = Field(default=None, description="额外元数据")


class AgentRegisterRequest(BaseModel):
    """Agent 注册请求。"""
    role: str = Field(..., description="角色类型")
    url: str = Field(..., description="Agent 服务 URL")
    name: str | None = Field(default=None, description="显示名称（可选）")
    api_key: str | None = Field(default=None, description="API Key（可选）")
    model: str | None = Field(default=None, description="指定模型（可选）")


class AgentRegisterResponse(BaseModel):
    """Agent 注册响应。"""
    id: str = Field(..., description="注册 ID")
    manifest: AgentManifest = Field(..., description="Agent 清单")
    status: str = Field(default="registered", description="注册状态")
