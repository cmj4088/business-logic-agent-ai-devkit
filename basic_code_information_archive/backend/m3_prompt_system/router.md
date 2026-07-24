# router.py — 提示词系统路由

## 概述
该文件定义了 M3 提示词系统的 FastAPI 路由层，提供模板管理（列表、查看、更新）和提示词渲染（直接渲染、带上下文预览）的 HTTP 接口。所有路由均需要用户认证，统一返回 `{data, error, meta}` 三段式响应格式。

## 函数/类详细说明

### router（模块级变量）
- **功能**: FastAPI APIRouter 实例，前缀为 `/api/prompts`，标签为 `"提示词"`

### GET /api/prompts/templates — list_templates()
- **功能**: 获取所有可用提示词模板的列表
- **参数**: `user: dict` — 当前认证用户（依赖注入）
- **返回值**: `{"data": templates, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 遍历 `ROLE_NAMES` 字典，为每个角色构建模板信息（`role`、`name`、`has_custom`），MVP 阶段 `has_custom` 固定为 `False`

### GET /api/prompts/templates/{role} — get_template()
- **功能**: 获取指定角色的提示词模板详情
- **参数**:
  - `role: str` — 路径参数，角色标识
  - `user: dict` — 当前认证用户（依赖注入）
- **返回值**: `{"data": {"role": role, "name": ..., "content": ..., "version": "1.0", "updated_at": ""}, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 创建 `PromptRenderer` 实例，调用 `get_template_content` 获取模板内容

### PUT /api/prompts/templates/{role} — update_template()
- **功能**: 更新角色提示词模板（MVP 阶段仅做语法验证，不持久化）
- **参数**:
  - `role: str` — 路径参数，角色标识
  - `request: TemplateUpdateRequest` — 请求体，包含模板内容和版本号
  - `user: dict` — 当前认证用户（依赖注入）
- **返回值**:
  - 验证通过: `{"data": {"role": role, "message": "模板验证通过（MVP 阶段不持久化自定义模板）"}, "error": None, ...}`
  - 验证失败: `{"data": None, "error": {"code": "VALIDATION_ERROR", "message": "模板语法错误: ..."}, ...}`
- **关键逻辑**: 调用 `PromptRenderer.validate_template` 验证 Jinja2 语法

### POST /api/prompts/render — render_prompt()
- **功能**: 渲染 system prompt（内部调用，使用传入的上下文直接渲染）
- **参数**:
  - `request: RenderRequest` — 请求体，包含角色和项目上下文
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**:
  - 成功: `{"data": {"prompt": ..., "role": ...}, "error": None, ...}`
  - 失败: `{"data": None, "error": {"code": "INTERNAL_ERROR", "message": ...}, ...}`
- **关键逻辑**: 直接使用请求中的 `project_context` 渲染，不从数据库构建上下文

### POST /api/prompts/preview — preview_prompt()
- **功能**: 预览渲染后的提示词（带完整上下文构建，从数据库获取项目信息）
- **参数**:
  - `request: RenderRequest` — 请求体，包含角色和项目上下文
  - `user: dict` — 当前认证用户（依赖注入）
  - `db: AsyncSession` — 数据库会话（依赖注入）
- **返回值**:
  - 成功: `{"data": {"prompt": ..., "role": ..., "context_used": context}, "error": None, ...}`
  - 失败: `{"data": None, "error": {"code": "INTERNAL_ERROR", "message": ...}, ...}`
- **关键逻辑**:
  1. 检查 `request.project_context` 中是否包含 `project.id`
  2. 若有项目 ID，调用 `build_context` 从数据库构建完整上下文（包含项目信息、阶段信息、产出物列表）
  3. 若 `build_context` 失败，静默回退到使用传入的上下文
  4. 返回的 `context_used` 字段显示实际使用的上下文数据

## 依赖关系
- `fastapi.APIRouter`, `Depends` — 路由定义和依赖注入
- `sqlalchemy.ext.asyncio.AsyncSession` — 异步数据库会话
- `m0_infrastructure.database.get_db` — 数据库会话依赖
- `m1_auth_security.middleware.get_current_user` — 用户认证依赖
- `.models.RenderRequest`, `TemplateUpdateRequest` — 本模块的请求模型
- `.renderer.PromptRenderer`, `ROLE_NAMES`, `DEFAULT_TEMPLATES` — 本模块的渲染器和常量
- `.context_builder.build_context` — 本模块的上下文构建器

## 注意事项
- `render` 和 `preview` 的区别：`render` 是内部调用接口，直接使用传入的上下文；`preview` 是前端预览接口，会自动从数据库构建完整上下文
- `update_template` 在 MVP 阶段仅验证语法，不将模板持久化到数据库或文件系统
- 模板版本号在 MVP 阶段固定为 `"1.0"`，更新时间 `updated_at` 为空字符串
- `DEFAULT_TEMPLATES` 的导入在路由中未直接使用，可能是预留的
- `preview` 路由中 `build_context` 失败时静默处理（`pass`），不会向用户报告错误，可能导致渲染结果与预期不符
- 所有路由的异常处理在路由层通过 try/except 捕获，返回 `INTERNAL_ERROR` 而非抛出 HTTP 异常