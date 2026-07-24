# router.py — 工作流引擎路由

## 概述
该文件定义了 M2 工作流引擎的 FastAPI 路由层，将 HTTP 请求映射到 `WorkflowEngine` 的方法调用。所有路由均需要用户认证，通过依赖注入获取数据库会话。路由统一返回 `{data, error, meta}` 三段式响应格式。

## 函数/类详细说明

### router（模块级变量）
- **功能**: FastAPI APIRouter 实例，前缀为 `/api`，标签为 `"工作流"`

### GET /api/projects — list_projects()
- **功能**: 获取当前用户的项目列表（分页）
- **参数**:
  - `status: str | None` — 按状态筛选（查询参数，可选）
  - `page: int` — 页码，>= 1（查询参数，默认 1）
  - `page_size: int` — 每页条数，1-100（查询参数，默认 20）
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": result, "error": None, "meta": {"request_id": "", "page": page, "page_size": page_size, "total": total}}`
- **关键逻辑**: 创建 `WorkflowEngine` 实例，调用 `list_projects` 方法

### POST /api/projects — create_project()
- **功能**: 创建新项目
- **参数**:
  - `request: ProjectCreateRequest` — 请求体，包含项目名称、团队规模等
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": project, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 创建 `WorkflowEngine` 实例，调用 `create_project` 方法

### GET /api/projects/{project_id} — get_project()
- **功能**: 获取单个项目详情
- **参数**:
  - `project_id: str` — 路径参数，项目 ID
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": project, "error": None, "meta": {"request_id": ""}}`

### POST /api/projects/{project_id}/advance — advance_stage()
- **功能**: 推进项目到下一阶段
- **参数**:
  - `project_id: str` — 路径参数，项目 ID
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": project, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 调用 `WorkflowEngine.advance_stage`，内部会检查门禁阻断条件

### POST /api/projects/{project_id}/rollback — rollback_stage()
- **功能**: 回退项目到上一阶段
- **参数**:
  - `project_id: str` — 路径参数，项目 ID
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": project, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 调用 `WorkflowEngine.rollback_stage`，内部会检查回退次数限制

### GET /api/projects/{project_id}/stages/{stage} — get_stage_detail()
- **功能**: 获取特定阶段的详情（活动、门禁、小组件）
- **参数**:
  - `project_id: str` — 路径参数，项目 ID
  - `stage: str` — 路径参数，阶段名称
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": detail, "error": None, "meta": {"request_id": ""}}`

### GET /api/projects/{project_id}/stages — get_stages()
- **功能**: 获取项目所有阶段的概览列表
- **参数**:
  - `project_id: str` — 路径参数
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**: `{"data": stages, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 直接查询 `stage_states` 表，按创建时间排序返回所有阶段状态（不通过 WorkflowEngine）

### GET /api/workflows/stages — get_stage_info()
- **功能**: 获取 IPD 阶段和门禁的定义信息（供前端参考，无需认证）
- **参数**: 无
- **返回值**: `{"data": {"stages": [...], "gates": {...}, "criteria": {...}}, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 直接返回 `STAGE_ORDER`、`STAGE_GATES`、`EXIT_CRITERIA` 三个常量的数据

## 依赖关系
- `fastapi.APIRouter`, `Depends`, `Query` — 路由定义和依赖注入
- `sqlalchemy.text` — 原生 SQL 查询（`get_stages` 路由中使用）
- `sqlalchemy.ext.asyncio.AsyncSession` — 异步数据库会话
- `m0_infrastructure.database.get_db` — 数据库会话依赖
- `m1_auth_security.middleware.get_current_user` — 用户认证依赖
- `shared.types.IPDStage` — IPD 阶段枚举
- `.models.ProjectCreateRequest` — 本模块的请求模型
- `.engine.WorkflowEngine`, `STAGE_ORDER`, `DEFAULT_ACTIVITIES`, `STAGE_GATES`, `EXIT_CRITERIA` — 本模块的引擎和常量

## 注意事项
- 所有需要认证的路由都通过 `Depends(get_current_user)` 注入当前用户信息
- 响应格式统一为 `{data, error, meta}` 三段式，`error` 为 `None` 表示成功
- `get_stages` 路由直接在路由层查询数据库，未经过 `WorkflowEngine`，风格略有不同
- `get_stage_info` 路由（`/api/workflows/stages`）不需要认证，属于公开的元数据接口
- 路由中未对 `project_id` 做用户归属校验（如防止用户 A 访问用户 B 的项目），该逻辑应在中间件或 Engine 层补充