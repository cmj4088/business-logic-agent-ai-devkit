# models.py — Pydantic 请求/响应模型

## 概述
该文件定义了 M2 工作流引擎模块的所有 Pydantic 数据模型，包括请求体和响应体的结构定义。这些模型用于 FastAPI 路由的请求验证和响应序列化，确保数据格式的一致性和类型安全。

## 函数/类详细说明

### 类: ProjectCreateRequest(BaseModel)
- **功能**: 创建项目时的请求体模型
- **字段**:
  - `name: str` — 产品名称，长度 2-50 字符，必填
  - `template_id: str` — 模板 ID，默认值 `"standard_ipd_v3"`
  - `target_weeks: int` — 预计周数，范围 1-52，必填
  - `team_size: int` — 团队规模（人数），范围 1-1000，必填
  - `budget_limit: float` — 预算上限（美元），>= 0，必填
  - `industry: str` — 行业类型，默认值 `"其他"`
  - `description: str` — 项目描述，默认空字符串
- **关键逻辑**: 使用 Pydantic 的 `Field` 进行参数校验（`min_length`、`max_length`、`ge`、`le`）

### 类: ProjectResponse(BaseModel)
- **功能**: 项目信息的响应体模型
- **字段**:
  - `id: str` — 项目唯一 ID
  - `name: str` — 项目名称
  - `description: str` — 项目描述
  - `complexity_tier: ComplexityTier` — 复杂度等级（枚举类型）
  - `current_stage: IPDStage` — 当前 IPD 阶段（枚举类型）
  - `status: str` — 项目状态（如 active、completed）
  - `progress: float` — 项目进度百分比
  - `template_id: str` — 使用的模板 ID
  - `budget_limit: float` — 预算上限
  - `team_size: int` — 团队规模
  - `target_weeks: int` — 预计周数
  - `industry: str` — 行业类型
  - `created_at: str` — 创建时间
  - `updated_at: str` — 更新时间

### 类: StageDetail(BaseModel)
- **功能**: 阶段详情的响应体模型
- **字段**:
  - `stage: IPDStage` — 阶段枚举值
  - `status: str` — 阶段状态（active、pending、completed）
  - `activities: list[dict]` — 活动列表，默认空列表
  - `gates: list[dict]` — 门禁状态列表，默认空列表
  - `widgets: dict` — 侧边栏小组件数据，默认空字典

## 依赖关系
- `pydantic.BaseModel`, `Field` — 数据模型基类和字段定义
- `typing.Optional` — 可选类型标注
- `shared.types.IPDStage`, `ComplexityTier` — 共享枚举类型

## 注意事项
- `ProjectResponse` 中的 `complexity_tier` 和 `current_stage` 使用枚举类型，序列化时会被转换为枚举值字符串
- `StageDetail` 中的 `activities`、`gates`、`widgets` 使用 `list[dict]` 和 `dict` 泛型，未定义更具体的子模型，适合 MVP 阶段快速迭代
- 所有时间字段均为字符串类型（`str`），而非 `datetime` 对象，与数据库存储格式保持一致
- 该模块的模型仅用于 m2_workflow_engine 的路由层，不涉及数据库 ORM 映射