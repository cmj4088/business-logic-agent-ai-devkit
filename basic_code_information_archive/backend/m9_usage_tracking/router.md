# router.py — M9 用量追踪 API 路由

## 概述
该文件定义了 M9 用量追踪模块的所有 HTTP API 端点，使用 FastAPI 的 `APIRouter` 组织。所有端点统一挂载在 `/api/usage` 前缀下，需要用户认证（通过 `get_current_user` 依赖注入）。每个端点都调用 `UsageService` 执行业务逻辑，并返回统一格式的响应体 `{"data": ..., "error": None, "meta": {"request_id": ""}}`。

## 函数详细说明

### get_project_usage
- **路由**: `GET /api/usage/projects/{project_id}`
- **功能**: 获取指定项目的用量统计，包括总 Token 数、成本和按模型分布的数据。
- **参数**:
  - `project_id` (`str`): 路径参数，项目 ID。
  - `user` (`dict`): 通过 `Depends(get_current_user)` 注入的当前用户信息。
  - `db` (`AsyncSession`): 通过 `Depends(get_db)` 注入的异步数据库会话。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `project_id`, `total_tokens`, `total_cost`, `by_model` 等字段。
- **关键逻辑**: 创建 `UsageService` 实例并调用 `get_project_usage` 方法。

### get_summary
- **路由**: `GET /api/usage/summary`
- **功能**: 获取全局用量摘要，包括总 Token、总成本、总记录数和活跃项目数。
- **参数**: 同上（`user` 和 `db`）。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `total_tokens`, `total_cost`, `total_records`, `active_projects` 等字段。
- **关键逻辑**: 调用 `UsageService.get_summary()`，返回全局聚合数据。

### get_daily_trend
- **路由**: `GET /api/usage/daily`
- **功能**: 获取每日用量趋势，用于绘制趋势图。
- **参数**:
  - `days` (`int`): 查询参数，默认值 30，范围 1~365，表示回溯天数。
  - `user`, `db`: 同上。
- **返回值**: `{"data": list[dict], "error": None, "meta": {"request_id": ""}}`，其中 `data` 为每日用量数据列表。
- **关键逻辑**: 将 `days` 参数传递给 `UsageService.get_daily_trend()`。

### get_limits
- **路由**: `GET /api/usage/limits`
- **功能**: 获取当前所有用量限制配置。
- **参数**: `user`, `db`。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `limits` 列表，每个限制有 `id`, `max_tokens`, `period`, `is_active` 等字段。
- **关键逻辑**: 调用 `UsageService.get_limits()` 获取限制列表。

### update_limits
- **路由**: `PUT /api/usage/limits`
- **功能**: 创建新的用量限制配置（每次 PUT 都会新增一条记录，而非覆盖）。
- **参数**:
  - `request` (`UsageLimitUpdate`): 请求体，包含 `max_tokens`, `period`, `is_active`。
  - `user`, `db`: 同上。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，返回新创建的限制记录。
- **关键逻辑**: 从请求体解构三个字段，传递给 `UsageService.update_limits()`。

### check_budget
- **路由**: `GET /api/usage/projects/{project_id}/budget`
- **功能**: 检查项目预算状态，当使用量达到 80% 时发出警告，达到 100% 时返回阻止状态。
- **参数**:
  - `project_id` (`str`): 路径参数，项目 ID。
  - `user`, `db`: 同上。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `budget_limit`, `total_cost`, `usage_percent`, `status`（`ok`/`warning`/`blocked`）, `message`。
- **关键逻辑**: 调用 `UsageService.check_budget()` 获取预算状态。

## 依赖关系
- `fastapi.APIRouter`: 路由定义。
- `fastapi.Depends`: 依赖注入。
- `fastapi.Query`: 查询参数定义。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话类型。
- `m0_infrastructure.database.get_db`: 数据库会话注入依赖。
- `m1_auth_security.middleware.get_current_user`: 用户认证依赖。
- `.models.UsageLimitUpdate`: 请求体模型。
- `.usage_service.UsageService`: 业务逻辑服务类。

## 注意事项
- 所有端点都需要用户认证，未登录用户无法访问。
- 所有响应使用统一的包装格式，`data` 字段承载实际业务数据。
- `meta` 中的 `request_id` 目前为空字符串，后续可接入请求追踪系统填充。
- 该模块的路由前缀为 `/api/usage`，标签为 "用量"。