# router.py — M10 异常恢复 API 路由

## 概述
该文件定义了 M10 异常恢复模块的所有 HTTP API 端点，使用 FastAPI 的 `APIRouter` 组织。所有端点统一挂载在 `/api/recovery` 前缀下，需要用户认证（通过 `get_current_user` 依赖注入）。每个端点都调用 `RecoveryManager` 执行业务逻辑，并返回统一格式的响应体 `{"data": ..., "error": None, "meta": {"request_id": ""}}`。

## 函数详细说明

### get_recovery_status
- **路由**: `GET /api/recovery/status`
- **功能**: 获取当前项目的恢复状态，包括是否有进行中的恢复动作、最近的恢复动作记录和摘要统计。
- **参数**:
  - `project_id` (`str`): 查询参数，必填，项目 ID。
  - `user` (`dict`): 通过 `Depends(get_current_user)` 注入的当前用户信息。
  - `db` (`AsyncSession`): 通过 `Depends(get_db)` 注入的异步数据库会话。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `project_id`, `status`, `active_actions`, `recent_actions`, `summary`。
- **关键逻辑**: 创建 `RecoveryManager` 实例，调用 `get_recovery_status` 方法。

### execute_recovery_action
- **路由**: `POST /api/recovery/actions`
- **功能**: 执行指定的恢复动作。支持 7 种动作类型：重新生成产出物、辩论死锁裁决、切换 LLM 模型、带着遗留问题前进、重试当前阶段、回退到上一阶段、人工干预。
- **参数**:
  - `request` (`RecoveryActionRequest`): 请求体，包含 `action_type` 和 `params`。
  - `user`, `db`: 同上（认证和数据库会话）。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `action_id`, `action_type`, `status`, `result`。
- **关键逻辑**:
  1. 从 `request.params` 中提取 `project_id`（默认为空字符串）。
  2. 创建 `RecoveryManager` 实例，调用 `execute_action` 方法。
  3. `project_id` 从 `params` 字典中获取，而非作为独立字段，使用时需确保 `params` 中包含此键。

### resolve_debate_deadlock
- **路由**: `POST /api/recovery/debate/{round_id}/resolve`
- **功能**: 辩论死锁裁决。支持三种裁决方式：主持人裁决 (`moderator_decide`)、重新开始辩论 (`restart`)、忽略死锁继续 (`proceed`)。
- **参数**:
  - `round_id` (`str`): 路径参数，辩论轮次 ID。
  - `request` (`DebateResolveRequest`): 请求体，包含 `round_id`（与路径参数重复）和 `resolution`。
  - `user`, `db`: 同上。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `round_id`, `resolution`, `action`, `resolved_at`。
- **关键逻辑**: 使用路径参数中的 `round_id`（而非请求体中的），调用 `RecoveryManager.resolve_debate_deadlock`。

### regenerate_artifact
- **路由**: `POST /api/recovery/regenerate/{artifact_id}`
- **功能**: 重新生成产出物。将当前版本保存到 `artifact_versions` 表，递增版本号。实际重新生成由 M4 Agent 编排模块负责。
- **参数**:
  - `artifact_id` (`str`): 路径参数，产出物 ID。
  - `request` (`RegenerateRequest`): 请求体，包含 `artifact_id`（与路径参数重复）、`temperature`（默认 0.9）、`model`（默认 "ollama"）。
  - `user`, `db`: 同上。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `artifact_id`, `artifact_name`, `old_version`, `new_version`, `old_version_saved_as`, `temperature`, `model`, `message`。
- **关键逻辑**: 使用路径参数中的 `artifact_id`，以及请求体中的 `temperature` 和 `model`，调用 `RecoveryManager.regenerate_artifact`。

### proceed_with_issues
- **路由**: `POST /api/recovery/proceed-with-issues`
- **功能**: 带着遗留问题前进。将门禁中未解决的问题标记为"已接受(遗留)"，门禁标记为"有条件通过"，允许项目继续推进但记录风险。
- **参数**:
  - `request` (`ProceedWithIssuesRequest`): 请求体，包含 `project_id`, `gate_id`, `reason`, `accepted_issue_ids`。
  - `user`, `db`: 同上。
- **返回值**: `{"data": dict, "error": None, "meta": {"request_id": ""}}`，其中 `data` 包含 `project_id`, `gate_id`, `accepted_issues`, `issue_ids`, `reason`, `message`。
- **关键逻辑**: 解构请求体的四个字段，传递给 `RecoveryManager.proceed_with_issues`。

## 依赖关系
- `fastapi.APIRouter`: 路由定义。
- `fastapi.Depends`: 依赖注入。
- `fastapi.Query`: 查询参数定义。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话类型。
- `m0_infrastructure.database.get_db`: 数据库会话注入依赖。
- `m1_auth_security.middleware.get_current_user`: 用户认证依赖。
- `.models.RecoveryActionRequest`: 通用恢复动作请求体。
- `.models.DebateResolveRequest`: 辩论死锁裁决请求体。
- `.models.RegenerateRequest`: 重新生成产出物请求体。
- `.models.ProceedWithIssuesRequest`: 带着遗留问题前进请求体。
- `.recovery_manager.RecoveryManager`: 恢复管理器业务逻辑类。

## 注意事项
- 所有端点都需要用户认证，未登录用户无法访问。
- 所有响应使用统一的包装格式，`data` 字段承载实际业务数据。
- `execute_recovery_action` 端点中，`project_id` 从 `request.params` 字典中提取，这是通用端点设计的权衡，调用方需确保 `params` 中包含 `project_id`。
- `resolve_debate_deadlock` 和 `regenerate_artifact` 两个端点中，请求体模型包含与路径参数同名的字段（`round_id` 和 `artifact_id`），实际处理时以路径参数为准，请求体中的同名字段被忽略。
- 该模块的路由前缀为 `/api/recovery`，标签为 "异常恢复"。
- `meta` 中的 `request_id` 目前为空字符串，后续可接入请求追踪系统填充。