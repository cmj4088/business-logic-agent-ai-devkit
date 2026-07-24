# models.py — Pydantic 模型

## 概述
该文件定义了 M3 提示词系统模块的所有 Pydantic 数据模型，包括提示词渲染请求、模板更新请求和模板响应。这些模型用于 FastAPI 路由的请求验证和响应序列化。

## 函数/类详细说明

### 类: RenderRequest(BaseModel)
- **功能**: 提示词渲染请求体模型
- **字段**:
  - `role: str` — Agent 角色名称，必填。支持的角色：`product_manager`（产品经理）、`rd`（研发架构师）、`qa`（测试专家）、`marketing`（市场专家）、`manufacturing`（制造工程师）、`finance`（财务分析师）
  - `project_context: dict` — 项目上下文变量，默认空字典。包含 `project`、`stage`、`artifacts`、`user_input` 等子字段

### 类: TemplateUpdateRequest(BaseModel)
- **功能**: 模板更新请求体模型
- **字段**:
  - `content: str` — Jinja2 模板内容，必填
  - `version: str` — 版本号，默认 `"1.0"`

### 类: TemplateResponse(BaseModel)
- **功能**: 模板信息响应体模型
- **字段**:
  - `role: str` — 角色标识
  - `name: str` — 角色中文名称
  - `content: str` — 模板内容
  - `version: str` — 版本号
  - `updated_at: str` — 更新时间

## 依赖关系
- `pydantic.BaseModel`, `Field` — 数据模型基类和字段定义
- `typing.Optional` — 可选类型标注（当前文件中实际未使用，可能是预留的）

## 注意事项
- `RenderRequest.project_context` 使用 `dict` 泛型而非强类型子模型，给予调用方灵活性，适合 MVP 阶段
- `TemplateUpdateRequest` 在当前 MVP 阶段仅用于模板验证，不实际持久化到数据库
- `TemplateResponse` 中的 `updated_at` 在 MVP 阶段可能为空字符串（因为模板未持久化）
- `typing.Optional` 已导入但未在模型中实际使用，可在后续清理