# router.py — 插件系统 API 路由

## 概述
该文件是 M7 插件系统的 HTTP API 路由层，基于 FastAPI 的 `APIRouter` 定义了插件的安装、查询、配置更新、启用/禁用、卸载和测试连接等 RESTful API 端点。所有端点统一挂载在 `/api/plugins` 路径前缀下，需要用户认证，返回统一的 `{data, error, meta}` 响应格式。

## 路由前缀与标签
- **前缀**: `/api/plugins`
- **标签**: `"插件"`

## 依赖注入

每个端点都依赖以下注入：
- `request: Request`: FastAPI 请求对象，用于获取 `request_id`。
- `user: dict = Depends(get_current_user)`: 从 `m1_auth_security.middleware` 获取当前登录用户。
- `db: AsyncSession = Depends(get_db)`: 从 `m0_infrastructure.database` 获取异步数据库会话。

## 端点详细说明

### GET /api/plugins — list_plugins
- **功能**: 获取已安装的插件列表。
- **认证**: 需要登录用户。
- **响应格式**: `{"data": [...], "error": null, "meta": {"request_id": "..."}}`。
- **业务逻辑**: 调用 `PluginService.list_plugins()`，返回按安装时间降序排列的插件列表。
- **异常处理**: 捕获 `AppException`，转换错误信息到统一响应格式。

### GET /api/plugins/available — get_available_plugins
- **功能**: 获取可用插件市场列表（MVP 阶段仅返回内置插件）。
- **认证**: 需要登录用户。
- **响应格式**: 同上。
- **业务逻辑**: 调用 `PluginService.get_available_plugins()`，已安装的插件标记 `installed=True`。
- **关键逻辑**: 该端点不需要 `plugin_id` 路径参数，返回所有可用插件。

### POST /api/plugins/install — install_plugin
- **功能**: 安装插件。
- **认证**: 需要登录用户。
- **请求体**: `PluginInstallRequest`（`plugin_id` + `config`）。
- **响应格式**: 同上。
- **业务逻辑**: 调用 `PluginService.install_plugin(body.plugin_id, body.config)`。
- **异常**: 插件不存在（404）或已安装（409）时返回错误响应。

### GET /api/plugins/{plugin_id} — get_plugin
- **功能**: 获取单个插件详情。
- **路径参数**: `plugin_id` (`str`): 插件 ID。
- **认证**: 需要登录用户。
- **响应格式**: 同上。
- **业务逻辑**: 调用 `PluginService.get_plugin(plugin_id)`，若返回 `None` 则抛出 404 异常。
- **关键逻辑**: 路由层额外做了 `None` 检查，将服务层返回的 `None` 转换为 `AppException`。

### PUT /api/plugins/{plugin_id} — update_plugin
- **功能**: 更新插件配置和/或启用状态。
- **路径参数**: `plugin_id` (`str`): 插件 ID。
- **请求体**: `PluginConfigUpdateRequest`（`config` + `enabled`，均为可选）。
- **认证**: 需要登录用户。
- **响应格式**: 同上。
- **业务逻辑**: 调用 `PluginService.update_plugin(plugin_id, config, enabled)`，`config` 为空字典时传 `None`。

### DELETE /api/plugins/{plugin_id} — uninstall_plugin
- **功能**: 卸载插件。
- **路径参数**: `plugin_id` (`str`): 插件 ID。
- **认证**: 需要登录用户。
- **响应格式**: 成功时 `data` 包含 `{"message": "插件已卸载", "plugin_id": "..."}`。
- **业务逻辑**: 调用 `PluginService.uninstall_plugin(plugin_id)`，成功后返回确认消息。

### POST /api/plugins/{plugin_id}/toggle — toggle_plugin
- **功能**: 启用/禁用插件。
- **路径参数**: `plugin_id` (`str`): 插件 ID。
- **请求体**: `PluginToggleRequest`（`enabled` 布尔值）。
- **认证**: 需要登录用户。
- **响应格式**: 同上。
- **业务逻辑**: 调用 `PluginService.toggle_plugin(plugin_id, body.enabled)`。

### POST /api/plugins/{plugin_id}/test — test_plugin
- **功能**: 测试插件连接。
- **路径参数**: `plugin_id` (`str`): 插件 ID。
- **认证**: 需要登录用户。
- **响应格式**: 同上，`data` 包含 `success`、`message`、`plugin_id` 等字段。
- **业务逻辑**: 调用 `PluginService.test_plugin(plugin_id)`，返回测试结果（含成功/失败信息和原因）。

## 异常处理模式

所有端点统一使用 try/except 捕获 `AppException`：
- 正常情况：返回 `{"data": ..., "error": None, "meta": {"request_id": "..."}}`。
- 异常情况：返回 `{"data": None, "error": {"code": "...", "message": "..."}, "meta": {...}}`。

## 依赖关系
- `fastapi.APIRouter, Depends, Request`: 路由定义和依赖注入。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。
- `m0_infrastructure.database.get_db`: 数据库会话工厂。
- `m1_auth_security.middleware.get_current_user`: 用户认证中间件。
- `shared.errors.ErrorCode, AppException`: 统一错误处理。
- `.models.PluginInstallRequest, PluginConfigUpdateRequest, PluginToggleRequest`: 请求体模型。
- `.plugin_service.PluginService`: 业务逻辑服务。

## 注意事项
- 所有端点都需要认证，未登录用户无法访问。
- 路由中不包含分页逻辑，列表端点直接返回全部数据（MVP 阶段插件数量有限）。
- 错误响应中 `request_id` 来自 `request.state.request_id`，需要中间件预先设置。
- `PluginResponse` 模型在 `models.py` 中定义但在路由中未被使用，所有响应均返回 `dict` 类型。