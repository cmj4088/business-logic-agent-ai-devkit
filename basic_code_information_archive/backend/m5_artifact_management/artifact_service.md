# artifact_service.py — 产出物管理核心服务

## 概述
该文件是 M5 产出物管理模块的核心服务层，封装了产出物（Artifact）的完整生命周期管理逻辑，包括创建、查询、更新、删除（软删除）以及版本管理功能。所有数据库操作均通过 SQLAlchemy 的异步会话（AsyncSession）以参数化 SQL 方式执行，确保 SQL 注入安全。

## 函数/类详细说明

### generate_artifact_id()
- **功能**: 生成唯一的产出物 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `art_` 前缀 + 12 位十六进制随机字符串，例如 `art_a1b2c3d4e5f6`。
- **关键逻辑**: 使用 `uuid.uuid4().hex[:12]` 生成随机部分，确保全局唯一性。

### generate_version_id()
- **功能**: 生成唯一的版本记录 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `ver_` 前缀 + 12 位十六进制随机字符串，例如 `ver_a1b2c3d4e5f6`。
- **关键逻辑**: 与 `generate_artifact_id()` 类似，但使用 `ver_` 前缀以区分实体类型。

### ArtifactService
产出物管理服务类，所有方法均为异步方法。

#### __init__(self, db: AsyncSession)
- **功能**: 初始化服务实例，注入数据库会话。
- **参数**:
  - `db`: SQLAlchemy 异步会话对象，用于执行数据库操作。
- **返回值**: 无。

#### async create_artifact(self, project_id, artifact_type, name, content, stage, ai_metadata=None)
- **功能**: 创建新产出物，初始版本号设为 1，同时插入产出物主记录和版本记录。
- **参数**:
  - `project_id` (str): 所属项目 ID。
  - `artifact_type` (str): 产出物类型（如 mrd、prd、system_design 等）。
  - `name` (str): 产出物名称。
  - `content` (str): 产出物内容（Markdown 格式）。
  - `stage` (str): 所属阶段（如 concept、plan、develop 等）。
  - `ai_metadata` (dict | None): 可选的 AI 元数据，默认为 None（实际存储为空 JSON 对象）。
- **返回值**: `dict` — 创建后的完整产出物详情（通过调用 `get_artifact` 获取）。
- **关键逻辑**:
  1. 生成 `artifact_id` 和 `version_id`。
  2. 将 `ai_metadata` 序列化为 JSON 字符串。
  3. 向 `artifacts` 表插入主记录（version=1）。
  4. 向 `artifact_versions` 表插入初始版本记录。
  5. 提交事务后返回完整产出物详情。

#### async get_artifact(self, artifact_id)
- **功能**: 根据 ID 获取单个产出物详情（排除已软删除的记录）。
- **参数**:
  - `artifact_id` (str): 产出物 ID。
- **返回值**: `dict` — 产出物详情字典。
- **关键逻辑**:
  1. 查询时过滤 `deleted_at IS NULL`，确保不返回已删除的产出物。
  2. 若未找到则抛出 `AppException(ErrorCode.NOT_FOUND, "产出物不存在", status_code=404)`。
  3. 通过 `_row_to_dict` 将数据库行转换为字典。

#### async list_artifacts(self, project_id, stage=None, artifact_type=None)
- **功能**: 按项目、阶段和类型筛选产出物列表。
- **参数**:
  - `project_id` (str): 必选，项目 ID。
  - `stage` (str | None): 可选，按阶段过滤。
  - `artifact_type` (str | None): 可选，按产出物类型过滤。
- **返回值**: `list[dict]` — 产出物字典列表，按创建时间降序排列。
- **关键逻辑**:
  1. 基础查询条件为 `project_id + deleted_at IS NULL`。
  2. 动态拼接 `stage` 和 `artifact_type` 过滤条件。
  3. 结果按 `created_at DESC` 排序。

#### async update_artifact(self, artifact_id, content, change_summary="")
- **功能**: 更新产出物内容，自动递增版本号并创建新版本记录。
- **参数**:
  - `artifact_id` (str): 产出物 ID。
  - `content` (str): 新的产出物内容。
  - `change_summary` (str): 变更摘要，默认为空字符串。
- **返回值**: `dict` — 更新后的完整产出物详情。
- **关键逻辑**:
  1. 先调用 `get_artifact` 获取当前版本号，新版本 = 当前版本 + 1。
  2. 更新 `artifacts` 表中的 `content`、`version`、`updated_at`。
  3. 向 `artifact_versions` 表插入新版本记录。
  4. 注意：`change_summary` 参数目前未实际存储到数据库，仅用于接口兼容。

#### async delete_artifact(self, artifact_id)
- **功能**: 软删除产出物（设置 `deleted_at` 时间戳，而非物理删除）。
- **参数**:
  - `artifact_id` (str): 产出物 ID。
- **返回值**: `None`。
- **关键逻辑**:
  1. 先调用 `get_artifact` 确认产出物存在。
  2. 将 `deleted_at` 和 `updated_at` 设为当前时间。
  3. 提交事务。

#### async get_versions(self, artifact_id)
- **功能**: 获取产出物的所有版本历史记录。
- **参数**:
  - `artifact_id` (str): 产出物 ID。
- **返回值**: `list[dict]` — 版本记录列表，每个元素包含 `id`、`artifact_id`、`version`、`content`、`created_at`，按版本号降序排列。
- **关键逻辑**:
  1. 先确认产出物存在。
  2. 查询 `artifact_versions` 表，按 `version DESC` 排序。

#### async get_version(self, artifact_id, version)
- **功能**: 获取产出物的特定版本内容。
- **参数**:
  - `artifact_id` (str): 产出物 ID。
  - `version` (int): 版本号。
- **返回值**: `dict` — 该版本的详细信息。
- **关键逻辑**:
  1. 先确认产出物存在。
  2. 按 `artifact_id + version` 精确查询。
  3. 若版本不存在则抛出 `AppException(ErrorCode.NOT_FOUND, f"版本 {version} 不存在", status_code=404)`。

#### _row_to_dict(self, row)
- **功能**: 将 SQLAlchemy 查询结果行转换为字典。
- **参数**:
  - `row`: 数据库查询结果行对象。
- **返回值**: `dict` — 包含 `id`、`project_id`、`artifact_type`、`name`、`content`、`version`、`stage`、`ai_metadata`、`created_at`、`updated_at` 的字典。
- **关键逻辑**: 这是内部辅助方法，用于统一行到字典的转换逻辑，避免重复代码。

## 依赖关系
- `uuid`: 生成唯一 ID。
- `json`: 序列化/反序列化 AI 元数据。
- `datetime` / `timezone`: 生成 UTC 时间戳。
- `sqlalchemy.text`: 执行参数化 SQL 语句。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。
- `shared.errors.ErrorCode` / `AppException`: 统一错误处理。

## 注意事项
- 所有时间戳使用 UTC 时区（`datetime.now(timezone.utc)`），格式为 `%Y-%m-%d %H:%M:%S`。
- 删除操作是软删除，不会物理删除数据库记录，便于数据恢复和审计。
- `update_artifact` 方法的 `change_summary` 参数目前未持久化存储，后续版本可能需要扩展 `artifacts` 表或 `artifact_versions` 表字段。
- ID 生成使用 `uuid.uuid4().hex[:12]`，在极高并发场景下理论上有碰撞风险，但实际使用中概率极低。
- 版本号是简单的整数递增，不涉及语义化版本控制。