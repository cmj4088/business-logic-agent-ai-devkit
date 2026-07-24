# router.py — 产出物管理 API 路由

## 概述
该文件是 M5 产出物管理模块的 FastAPI 路由层，负责暴露产出物的 CRUD 操作和版本管理 API 端点。所有端点统一使用 `/api/artifacts` 前缀，依赖认证中间件（`get_current_user`）和数据库会话注入（`get_db`），并采用统一的响应格式 `{data, error, meta}`。

## 函数/类详细说明

### ARTIFACT_TYPES (模块级常量)
- **功能**: 定义 18 种 IPD 产出物类型，用于前端下拉选择和使用者参考。
- **结构**: 列表，每个元素为包含 `key`、`name`、`description` 的字典。
- **18 种类型**:
  | Key | 名称 | 描述 |
  |-----|------|------|
  | `mrd` | 市场需求文档 (MRD) | 市场需求和客户分析 |
  | `prd` | 产品需求文档 (PRD) | 产品功能和规格定义 |
  | `business_case` | 商业论证 | 项目商业价值与可行性分析 |
  | `competitive_analysis` | 竞品分析报告 | 竞争产品对比分析 |
  | `customer_needs` | 客户需求文档 | 客户需求调研与整理 |
  | `system_design` | 系统架构设计 | 系统整体架构设计文档 |
  | `bom` | 物料清单 (BOM) | 产品物料与成本估算 |
  | `risk_assessment` | 风险评估报告 | 项目风险评估与缓解计划 |
  | `detailed_design` | 详细设计文档 | 模块详细设计说明 |
  | `unit_test` | 单元测试报告 | 单元测试执行与结果 |
  | `test_cases` | 测试用例集 | 功能与集成测试用例 |
  | `system_test` | 系统测试报告 | 系统级测试执行与结果 |
  | `tr_review` | TR 评审报告 | 技术评审 (TR3/TR4/TR5/TR6) 报告 |
  | `gtm_plan` | GTM 执行计划 | 产品上市执行计划 |
  | `production_report` | 首批生产报告 | 首批生产质量与进度报告 |
  | `ops_review` | 运营评审报告 | 生命周期运营评审 |
  | `iteration_plan` | 迭代需求清单 | 产品迭代需求与路线图 |
  | `gate_materials` | 门禁材料 | 阶段门禁审批材料汇总 |

### router (模块级变量)
- **功能**: FastAPI `APIRouter` 实例，`prefix="/api/artifacts"`，`tags=["产出物管理"]`。

### GET /api/artifacts/types — get_artifact_types()
- **功能**: 获取所有 18 种产出物类型定义列表。
- **参数**: 无请求参数。
- **返回值**: `{"data": ARTIFACT_TYPES, "error": None, "meta": {"request_id": ""}}`。
- **关键逻辑**: 直接返回模块级常量 `ARTIFACT_TYPES`，无需数据库查询。

### GET /api/artifacts — list_artifacts()
- **功能**: 按项目、阶段和类型筛选产出物列表。
- **参数**:
  - `project_id` (str, Query): 必填，项目 ID。
  - `stage` (str | None, Query): 可选，所属阶段过滤。
  - `type` (str | None, Query): 可选，产出物类型过滤。
  - `user` (dict): 通过 `get_current_user` 依赖注入的当前用户信息。
  - `db` (AsyncSession): 通过 `get_db` 依赖注入的数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为产出物列表，失败时 `error` 包含错误码和消息。
- **关键逻辑**: 创建 `ArtifactService` 实例，调用 `list_artifacts` 方法。

### POST /api/artifacts — create_artifact()
- **功能**: 创建新产出物。
- **参数**:
  - `request` (ArtifactCreateRequest): 请求体。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为新创建的产出物详情。
- **关键逻辑**: 将请求体字段传递给 `ArtifactService.create_artifact`。

### GET /api/artifacts/{artifact_id} — get_artifact()
- **功能**: 获取单个产出物详情。
- **参数**:
  - `artifact_id` (str): 路径参数，产出物 ID。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式。

### PUT /api/artifacts/{artifact_id} — update_artifact()
- **功能**: 更新产出物内容（创建新版本）。
- **参数**:
  - `artifact_id` (str): 路径参数，产出物 ID。
  - `request` (ArtifactUpdateRequest): 请求体，包含新内容和变更摘要。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为更新后的产出物详情。
- **关键逻辑**: 调用 `update_artifact` 时会自动递增版本号并创建版本记录。

### DELETE /api/artifacts/{artifact_id} — delete_artifact()
- **功能**: 软删除产出物。
- **参数**:
  - `artifact_id` (str): 路径参数。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为 `{"message": "已删除", "id": artifact_id}`。
- **关键逻辑**: 软删除意味着只设置 `deleted_at` 时间戳，数据仍保留在数据库中。

### GET /api/artifacts/{artifact_id}/versions — get_versions()
- **功能**: 获取产出物的所有版本历史。
- **参数**:
  - `artifact_id` (str): 路径参数。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为版本列表（按版本号降序）。

### GET /api/artifacts/{artifact_id}/versions/{version} — get_version()
- **功能**: 获取产出物的特定版本内容。
- **参数**:
  - `artifact_id` (str): 路径参数。
  - `version` (int): 路径参数，版本号。
  - `user` (dict): 当前用户。
  - `db` (AsyncSession): 数据库会话。
- **返回值**: 统一响应格式，成功时 `data` 为该版本的详细信息。

## 依赖关系
- `fastapi.APIRouter` / `Depends` / `Query`: 路由定义和依赖注入。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话类型。
- `m0_infrastructure.database.get_db`: 数据库会话工厂依赖。
- `m1_auth_security.middleware.get_current_user`: 认证中间件依赖。
- `shared.errors.AppException`: 统一应用异常。
- 本地导入: `models.ArtifactCreateRequest` / `ArtifactUpdateRequest`、`artifact_service.ArtifactService`。

## 注意事项
- 所有端点均需要认证（通过 `get_current_user` 依赖），未认证请求会被中间件拦截。
- 统一响应格式 `{data, error, meta}` 中 `meta.request_id` 目前为空字符串，后续可扩展为请求追踪 ID。
- 查询参数 `type` 在路由中是 `type`，但传递给服务层时映射为 `artifact_type` 参数名。
- 路由中 `AppException` 被捕获并转换为统一错误响应格式，而非直接抛出 HTTP 异常。
- 静态路由 `/types` 和 `/versions` 子路径需要在动态路由 `/{artifact_id}` 之前定义，FastAPI 按定义顺序匹配路由。