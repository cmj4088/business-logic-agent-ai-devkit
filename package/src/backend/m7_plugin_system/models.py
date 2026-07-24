"""Pydantic 请求/响应模型 — M7 插件系统。"""
from pydantic import BaseModel, Field


class PluginInstallRequest(BaseModel):
    """插件安装请求。"""
    plugin_id: str = Field(..., description="插件 ID")
    config: dict = Field(default_factory=dict, description="插件配置")


class PluginConfigUpdateRequest(BaseModel):
    """插件配置更新请求。"""
    config: dict = Field(default_factory=dict, description="插件配置")
    enabled: bool | None = Field(default=None, description="是否启用")


class PluginToggleRequest(BaseModel):
    """插件启用/禁用请求。"""
    enabled: bool = Field(..., description="是否启用")


class PluginResponse(BaseModel):
    """插件响应。"""
    id: str = Field(..., description="内部记录 ID")
    plugin_id: str = Field(..., description="插件 ID")
    name: str = Field(..., description="插件名称")
    version: str = Field(..., description="版本号")
    enabled: bool = Field(..., description="是否启用")
    config: dict = Field(default_factory=dict, description="插件配置（API Key 已脱敏）")
    tools: list[dict] = Field(default_factory=list, description="插件工具列表")
    installed_at: str = Field(..., description="安装时间")


class AgentPluginRequest(BaseModel):
    """Agent 插件分配请求。"""
    plugin_ids: list[str] = Field(..., description="要分配给 Agent 的插件 ID 列表")