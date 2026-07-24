# router.py — 审核系统 API 路由

## 概述
该文件是 M6 审核系统的 FastAPI 路由层，负责暴露审核相关的所有 API 端点，包括审核列表、详情、投票、批量审核、升级、仪表盘和遗留问题管理。所有端点统一使用 `/api/reviews` 前缀，依赖认证中间件（`get_current_user`）和数据库会话注入（`get_db`），采用统一的响应格式 `{data, error, meta}`。

## 函数/类详细说明

### router (模块级变量)
- **功能**: FastAPI `APIRouter` 实例，`prefix="/api/reviews"`，`tags=["审核"]`。

### GET /api/reviews — list_reviews()
- **功能**: 获取审核任务列表，支持按项目和状态过滤。
- **参数**:
  - `project_id` (str | None, Query): 可选，按项目 ID 过滤。
  - `status` (str | None, Query): 可选，按状态过滤（pending/approved/rejected）。
  - `user` (dict): 通过 `get_current_user` 依赖注入的当前用户信息。
  - `db` (AsyncSession): 通过 `get_db` 依赖注入的数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为 `{items: [...], total: N}`。
- **关键逻辑**: 创建 `ReviewService` 实例，调用 `list_reviews` 方法。

### GET /api/reviews/dashboard — get_dashboard()
- **功能**: 获取审核仪表盘聚合数据，用于展示审核系统整体状态概览。
- **参数**:
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 包含 `total_reviews`、`status_breakdown`、`open_issues`、`resolved_issues`、`total_issues`、`recent_votes`、`mode` 等聚合字段。
- **关键逻辑**: 注册在 `/{review_id}` 动态路由之前，确保不会被路径参数捕获。

### GET /api/reviews/issues — get_issues()
- **功能**: 获取遗留问题列表，支持按项目过滤。
- **参数**:
  - `project_id` (str | None, Query): 可选，按项目 ID 过滤。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为 `{items: [...], total: N}`。
- **关键逻辑**: 必须在 `/{review_id}` 动态路由之前定义，否则 `/api/reviews/issues` 会被 `/{review_id}` 捕获，`review_id` 会被解析为 `"issues"`。

### GET /api/reviews/{review_id} — get_review()
- **功能**: 获取审核任务详情，包含投票记录和关联的遗留问题。
- **参数**:
  - `review_id` (str): 路径参数，审核任务 ID。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 包含审核基本信息、`votes` 列表和 `issues` 列表。

### POST /api/reviews/{review_id}/vote — submit_vote()
- **功能**: 提交门禁投票。单人模式下所有投票自动通过并标注 `auto_approved_due_to_single_user_mode`。
- **参数**:
  - `review_id` (str): 路径参数，审核任务 ID。
  - `request` (VoteRequest): 请求体，包含 `gate_id`、`vote`、`comment`。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为投票记录。
- **关键逻辑**:
  1. 先通过 `review_id` 查询 `review_tasks` 表获取 `project_id` 和 `gate_id`。
  2. 若审核任务不存在，直接返回错误响应（而非抛出异常）。
  3. 从 `user` 字典中提取 `role` 字段作为 `voter_role`，默认为 `reviewer`。
  4. 调用 `ReviewService.submit_vote` 执行投票逻辑。

### POST /api/reviews/batch — batch_vote()
- **功能**: 批量审核多个审核任务。
- **参数**:
  - `request` (BatchReviewRequest): 请求体，包含 `review_ids` 列表和 `vote`。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为 `{results: [...], total: N}`。
- **关键逻辑**: 注册在 `/{review_id}/vote` 和 `/{review_id}/escalate` 之前，确保 `/batch` 不被路径参数捕获。

### POST /api/reviews/{review_id}/escalate — escalate()
- **功能**: 升级审核任务，创建遗留问题。
- **参数**:
  - `review_id` (str): 路径参数，审核任务 ID。
  - `request` (EscalateRequest): 请求体，包含 `reason`（升级原因）。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 包含 `review_id`、`issue_id`、`status`、`reason`、`created_at`。
- **关键逻辑**:
  1. 调用 `ReviewService.escalate` 执行升级逻辑。
  2. 升级操作会将审核任务状态设为 `escalated`，并创建遗留问题记录。

## 依赖关系
- `fastapi.APIRouter` / `Depends` / `Query`: 路由定义和依赖注入。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话类型。
- `m0_infrastructure.database.get_db`: 数据库会话工厂依赖。
- `m1_auth_security.middleware.get_current_user`: 认证中间件依赖。
- `shared.errors.AppException`: 统一应用异常。
- 本地导入: `models.VoteRequest` / `BatchReviewRequest` / `EscalateRequest`、`review_service.ReviewService`。

## 注意事项
- 路由定义顺序至关重要：静态路径（`/dashboard`、`/issues`、`/batch`）必须在动态路径 `/{review_id}` 之前定义，否则 FastAPI 会将静态路径名当作 `review_id` 参数值进行匹配。
- 所有端点均需要认证（通过 `get_current_user` 依赖）。
- `submit_vote` 端点中，审核任务不存在的错误处理直接在路由层完成（返回错误响应），而非抛出异常，这是一个与其他端点不一致的处理方式。
- `submit_vote` 端点内部再次查询了 `review_tasks` 表以获取 `project_id` 和 `gate_id`，而 `VoteRequest` 中已经有 `gate_id` 字段，这里存在冗余查询。`VoteRequest.gate_id` 在路由中未被使用，实际使用的是从数据库查询出的 `gate_id`。
- 统一响应格式 `{data, error, meta}` 中 `meta.request_id` 目前为空字符串，后续可扩展为请求追踪 ID。
- 异常处理统一捕获 `AppException` 并转换为错误响应格式，确保前端始终收到一致的数据结构。