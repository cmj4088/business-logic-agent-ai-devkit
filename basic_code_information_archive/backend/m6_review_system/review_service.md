# review_service.py — 审核系统核心服务

## 概述
该文件是 M6 审核系统的核心业务逻辑层，负责审核任务的列表查询、详情获取、投票、批量审核、审核升级、仪表盘数据聚合以及遗留问题管理。MVP 阶段默认启用单人模式（`SINGLE_USER_MODE = True`），所有投票自动通过并标注 `auto_approved_due_to_single_user_mode`。所有数据库操作均通过 SQLAlchemy 异步会话以参数化 SQL 方式执行。

## 函数/类详细说明

### generate_review_id()
- **功能**: 生成唯一的审核任务 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `rvw_` 前缀 + 12 位十六进制随机字符串。

### generate_gate_result_id()
- **功能**: 生成唯一的门禁投票结果 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `gtr_` 前缀 + 12 位十六进制随机字符串。

### generate_issue_id()
- **功能**: 生成唯一的遗留问题 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `isu_` 前缀 + 12 位十六进制随机字符串。

### ReviewService
审核系统核心服务类，所有方法均为异步方法。

#### 类属性
- `SINGLE_USER_MODE` (bool): MVP 单人模式开关，默认 `True`。当为 `True` 时，所有投票自动变为 `approve` 并标注自动通过。

#### __init__(self, db: AsyncSession)
- **功能**: 初始化服务实例，注入数据库会话。
- **参数**:
  - `db`: SQLAlchemy 异步会话对象。
- **返回值**: `None`。

#### async list_reviews(self, project_id=None, status=None)
- **功能**: 获取审核任务列表，支持按项目和状态过滤。
- **参数**:
  - `project_id` (str | None): 可选，按项目 ID 过滤。
  - `status` (str | None): 可选，按状态过滤（pending/approved/rejected）。
- **返回值**: `dict` — 包含 `items` 列表和 `total` 计数的字典。
- **关键逻辑**:
  1. 使用 `WHERE 1=1` 作为基础查询，便于动态拼接条件。
  2. 结果按 `created_at DESC` 降序排列。
  3. `auto_approved` 字段从数据库的整数（0/1）转换为 Python 布尔值。

#### async get_review(self, review_id)
- **功能**: 获取审核任务详情，包含关联的投票记录和遗留问题。
- **参数**:
  - `review_id` (str): 审核任务 ID。
- **返回值**: `dict` — 审核详情，包含审核任务基本信息、`votes` 列表和 `issues` 列表。
- **关键逻辑**:
  1. 先查询 `review_tasks` 表获取审核任务。
  2. 若审核任务不存在则抛出 `AppException(ErrorCode.NOT_FOUND, "审核任务不存在", status_code=404)`。
  3. 通过 `project_id` 和 `gate_id` 关联查询 `gate_results`（门禁投票记录）和 `review_issues`（遗留问题）。
  4. 投票记录按 `attempt DESC` 排序，最新尝试在前。

#### async submit_vote(self, project_id, gate_id, voter_role, vote, comment="")
- **功能**: 提交门禁投票，支持单人模式自动通过。
- **参数**:
  - `project_id` (str): 项目 ID。
  - `gate_id` (str): 门禁 ID。
  - `voter_role` (str): 投票人角色。
  - `vote` (str): 投票结果，有效值为 `approve`、`reject`、`request_changes`。
  - `comment` (str): 审核意见，默认为空字符串。
- **返回值**: `dict` — 投票记录，包含投票结果和模式信息。
- **关键逻辑**:
  1. 校验 `vote` 值是否在有效列表中，无效则抛出 `AppException(ErrorCode.VALIDATION_ERROR, ..., status_code=422)`。
  2. 单人模式下：`effective_vote` 强制设为 `approve`，`is_auto` 设为 `True`。
  3. 查询当前最大 `attempt` 值并 +1 作为本次尝试编号。
  4. 从 `projects` 表查询 `current_stage` 以填充门禁记录的 `stage` 字段。
  5. 插入 `gate_results` 记录。
  6. 更新或创建 `review_tasks` 记录：如果已存在则更新状态，否则新建。
  7. 单人模式下 `comment` 自动替换为 `auto_approved_due_to_single_user_mode`。

#### async batch_vote(self, review_ids, vote)
- **功能**: 批量审核多个审核任务。
- **参数**:
  - `review_ids` (list[str]): 审核任务 ID 列表。
  - `vote` (str): 投票结果，有效值为 `approve`、`reject`。
- **返回值**: `dict` — 包含 `results` 处理结果列表和 `total` 总数。
- **关键逻辑**:
  1. 校验 `vote` 值，批量审核只支持 `approve` 和 `reject`。
  2. 遍历 `review_ids`，逐个处理每个审核任务。
  3. 若审核任务不存在，记录失败结果并继续处理下一个。
  4. 单人模式下所有投票强制为 `approve`。
  5. 更新 `review_tasks` 状态，插入 `gate_results` 记录。
  6. 批量审核时 `voter_role` 固定为 `batch_reviewer`，`stage` 固定为 `unknown`。

#### async escalate(self, review_id, reason)
- **功能**: 升级审核任务，创建遗留问题记录。
- **参数**:
  - `review_id` (str): 审核任务 ID。
  - `reason` (str): 升级原因，会作为遗留问题的描述。
- **返回值**: `dict` — 升级结果，包含 `review_id`、`issue_id`、`status`、`reason`、`created_at`。
- **关键逻辑**:
  1. 查询审核任务是否存在，不存在则抛出 404 异常。
  2. 将审核任务状态更新为 `escalated`。
  3. 在 `review_issues` 表中创建遗留问题（状态为 `open`，描述为升级原因）。
  4. 两个操作在同一事务中提交。

#### async get_dashboard(self)
- **功能**: 获取审核仪表盘聚合数据，用于展示审核系统整体状态。
- **参数**: 无。
- **返回值**: `dict` — 包含以下字段的聚合数据：
  - `total_reviews`: 审核任务总数。
  - `status_breakdown`: 按状态分组的计数（字典，key 为状态名，value 为数量）。
  - `open_issues`: 未解决的遗留问题数。
  - `resolved_issues`: 已解决的遗留问题数。
  - `total_issues`: 遗留问题总数。
  - `recent_votes`: 最近 10 条投票记录。
  - `mode`: 当前模式（`single_user` 或 `multi_user`）。
- **关键逻辑**:
  1. 执行 5 个独立的聚合查询：总数、状态分布、未解决问题数、已解决问题数、近期投票。
  2. 状态分布使用 `GROUP BY status` 聚合。
  3. 近期投票按 `created_at DESC` 排序，限制 10 条。

#### async get_issues(self, project_id=None)
- **功能**: 获取遗留问题列表，支持按项目过滤。
- **参数**:
  - `project_id` (str | None): 可选，按项目 ID 过滤。
- **返回值**: `dict` — 包含 `items` 列表和 `total` 计数的字典。
- **关键逻辑**:
  1. 动态拼接查询条件，支持可选的 `project_id` 过滤。
  2. 结果按 `created_at DESC` 降序排列。

## 依赖关系
- `uuid`: 生成唯一 ID。
- `datetime` / `timezone`: 生成 UTC 时间戳。
- `sqlalchemy.text`: 执行参数化 SQL 语句。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。
- `shared.errors.AppException` / `ErrorCode`: 统一错误处理。

## 注意事项
- `SINGLE_USER_MODE = True` 是 MVP 阶段的临时设计，多用户场景下需要改为 `False` 并实现真正的多角色投票逻辑。
- 单人模式下所有 `comment` 会被替换为 `auto_approved_due_to_single_user_mode`，原始评论内容丢失。
- `batch_vote` 方法中 `stage` 固定为 `unknown`，与 `submit_vote` 会查询实际 `current_stage` 不同，可能是不一致之处。
- 所有时间戳使用 UTC 时区，格式为 `%Y-%m-%d %H:%M:%S`。
- `list_reviews` 返回的 `total` 是 `len(rows)` 而非 `COUNT(*)` 的结果，在小数据量下无差异，但大数据量时可能不准确（如果后续加入分页）。
- `get_dashboard` 中的聚合查询可能在大数据量下性能较差，后续可考虑使用物化视图或缓存。
- ID 生成规则与 M5 模块一致，使用 `uuid.uuid4().hex[:12]` + 对应前缀。