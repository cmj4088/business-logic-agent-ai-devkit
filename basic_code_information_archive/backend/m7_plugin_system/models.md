# models.py — 插件系统请求/响应模型

## 概述
该文件是 M7 插件系统模块的数据模型层，使用 Pydantic 定义了插件安装、配置更新、启用/禁用和查询响应等场景下的请求/响应数据结构。所有模型均继承自 `pydantic.BaseModel`，利用 `Field` 提供字段描述和默认值。

## 类详细说明

### PluginInstallRequest
- **功能**: 插件安装请求的数据模型。
- **字段**:
  - `plugin_id` (`str`): 要安装的插件 ID，必填。
  - `config` (`dict`): 插件配置字典，默认为空字典。
- **关键逻辑**: 安装时只需传入插件 ID 和可选的配置参数，后端根据内置插件定义完成安装。

### PluginConfigUpdateRequest
- **功能**: 插件配置更新请求的数据模型。
- **字段**:
  - `config` (`dict`): 新的插件配置字典，默认为空字典。
  - `enabled` (`bool | None`): 是否启用插件，可选，默认 `None` 表示不修改启用状态。
- **关键逻辑**: 同时支持修改配置和启用状态，两者均为可选字段，允许只更新其中一项。

### PluginToggleRequest
- **功能**: 插件启用/禁用请求的数据模型。
- **字段**:
  - `enabled` (`bool`): 是否启用插件，必填。
- **关键逻辑**: 纯粹的开关操作，仅包含 `enabled` 一个必填布尔字段。

### PluginResponse
- **功能**: 插件信息响应的数据模型，用于返回插件详情给前端。
- **字段**:
  - `id` (`str`): 内部记录 ID（数据库主键）。
  - `plugin_id` (`str`): 插件标识 ID（如 "web_search"）。
  - `name` (`str`): 插件名称。
  - `version` (`str`): 版本号。
  - `enabled` (`bool`): 是否启用。
  - `config` (`dict`): 插件配置，敏感字段（API Key 等）已做脱敏处理。
  - `tools` (`list[dict]`): 插件提供的工具列表。
  - `installed_at` (`str`): 安装时间字符串。
- **关键逻辑**: 响应中 config 的 API Key 等敏感字段已被替换为 "***"，确保前端不暴露明文密钥。

## 依赖关系
- `pydantic.BaseModel`: 基础模型类。
- `pydantic.Field`: 字段定义辅助函数。

## 注意事项
- 该文件定义的模型在 `router.py` 中被用作请求体参数和响应模型。
- `PluginResponse` 虽然定义了但实际路由中并未直接使用（路由返回 `dict`），可能预留用于后续标准化。
- 所有模型都是纯数据结构，不包含业务逻辑。