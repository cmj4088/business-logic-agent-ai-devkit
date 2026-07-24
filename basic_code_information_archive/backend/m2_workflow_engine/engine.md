# engine.py — 核心工作流引擎

## 概述
该文件是 M2 工作流引擎的核心模块，负责 IPD（集成产品开发）流程的全部生命周期管理，包括：复杂度判定、阶段推进、阶段回退、活动裁剪、门禁判定。它是整个项目流程驱动的核心，所有项目状态变更均通过此引擎执行。

## 返回格式（2026-07-09 更新）
所有 API 响应字段已统一为 **camelCase** 格式，匹配前端 TypeScript 类型：
- `complexity_tier` → `complexity`
- `current_stage` → `currentStage`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `target_weeks` → `targetWeeks`
- `team_size` → `teamSize`
- `budget_limit` → `budgetLimit`
- 分页新增 `pageSize` 和 `totalPages` 字段

## 函数/类详细说明

### generate_project_id()
- **功能**: 生成唯一的项目 ID
- **参数**: 无
- **返回值**: `str` — 格式为 `proj_` 前缀 + 12 位十六进制随机字符串
- **关键逻辑**: 使用 `uuid.uuid4().hex[:12]` 生成随机部分

### generate_stage_id()
- **功能**: 生成唯一的阶段 ID
- **参数**: 无
- **返回值**: `str` — 格式为 `stage_` 前缀 + 12 位十六进制随机字符串

### generate_gate_id()
- **功能**: 生成唯一的门禁 ID
- **参数**: 无
- **返回值**: `str` — 格式为 `gate_` 前缀 + 12 位十六进制随机字符串

### generate_activity_id()
- **功能**: 生成唯一的活动 ID
- **参数**: 无
- **返回值**: `str` — 格式为 `act_` 前缀 + 12 位十六进制随机字符串

### STAGE_ORDER（常量）
- **功能**: 定义 IPD 六个阶段的顺序列表
- **值**: `[CONCEPT, PLAN, DEVELOP, VERIFY, LAUNCH, LIFECYCLE]`
- **用途**: 用于阶段推进、回退、进度计算

### STAGE_GATES（常量）
- **功能**: 定义每个阶段结束时需要经过的门禁
- **映射关系**:
  - CONCEPT → CDCP
  - PLAN → PDCP
  - DEVELOP → TR3, TR4
  - VERIFY → TR5, TR6
  - LAUNCH → ADCP
  - LIFECYCLE → LDCP

### DEFAULT_ACTIVITIES（常量）
- **功能**: 定义每个阶段默认的活动列表（lite 模式共 24 个活动）
- **结构**: 每个活动包含 `key`（唯一标识）、`name`（中文名称）、`human_input_required`（是否需要人工输入）
- **各阶段活动分布**:
  - CONCEPT: 客户需求调研、竞品分析、商业论证、MRD 撰写（4 个）
  - PLAN: PRD 撰写、系统架构设计、BOM 与成本估算、风险评估、PDCP 材料准备（5 个）
  - DEVELOP: 详细设计文档、单元测试报告、TR4 评审报告、测试用例集（4 个）
  - VERIFY: 系统测试报告、TR5 评审报告、TR6 评审报告、ADCP 材料准备（4 个）
  - LAUNCH: GTM 执行计划、首批生产报告（2 个）
  - LIFECYCLE: 运营评审报告、迭代需求清单（2 个）

### EXIT_CRITERIA（常量）
- **功能**: 定义每个门禁的退出条件（检查项），决定阶段能否推进
- **结构**: 每个检查项包含 `key`（唯一标识）、`description`（中文描述）、`is_blocking`（是否为阻断项）
- **阻断逻辑**: `is_blocking=True` 的检查项必须全部完成，否则阶段推进被拒绝

### determine_complexity(team_size, industry, certification_count, bom_items, has_hardware)
- **功能**: 根据项目参数自动判定复杂度等级
- **参数**:
  - `team_size: int` — 团队规模
  - `industry: str` — 行业类型
  - `certification_count: int` — 认证数量（默认 0）
  - `bom_items: int` — BOM 物料数量（默认 0）
  - `has_hardware: bool` — 是否包含硬件（默认 True）
- **返回值**: `ComplexityTier` 枚举值（FULL / STANDARD / LITE）
- **关键逻辑**:
  1. 医疗器械、汽车电子、航空行业 → FULL
  2. 认证数量 >= 3 → FULL
  3. 团队 <= 3 且 BOM <= 20 且无硬件 → LITE
  4. 其他情况 → STANDARD

### get_visible_activities(stage, complexity)
- **功能**: 根据复杂度等级裁剪活动列表
- **参数**:
  - `stage: IPDStage` — 当前阶段
  - `complexity: ComplexityTier` — 复杂度等级
- **返回值**: `list[dict]` — 该阶段可见的活动列表
- **关键逻辑**: 当前 MVP 版本中 lite 模式返回全部 24 个活动，standard 和 full 模式预留扩展

### get_next_stage(current_stage)
- **功能**: 获取当前阶段的下一个阶段
- **参数**: `current_stage: IPDStage` — 当前阶段
- **返回值**: `IPDStage | None` — 下一个阶段，若已是最后一个阶段则返回 None
- **关键逻辑**: 在 STAGE_ORDER 列表中查找当前阶段索引，返回索引 +1 的元素

### get_previous_stage(current_stage)
- **功能**: 获取当前阶段的上一个阶段
- **参数**: `current_stage: IPDStage` — 当前阶段
- **返回值**: `IPDStage | None` — 上一个阶段，若已是第一个阶段则返回 None
- **关键逻辑**: 在 STAGE_ORDER 列表中查找当前阶段索引，返回索引 -1 的元素

### get_stage_progress(stage)
- **功能**: 根据当前阶段计算项目整体进度百分比
- **参数**: `stage: IPDStage` — 当前阶段
- **返回值**: `float` — 进度百分比（如 16.7, 33.3, ..., 100.0）
- **关键逻辑**: `(阶段索引 + 1) / 阶段总数 * 100`，保留一位小数

### 类: WorkflowEngine
- **功能**: 工作流引擎主类，封装所有项目流程操作
- **构造参数**: `db: AsyncSession` — SQLAlchemy 异步数据库会话

#### create_project(user_id, request)
- **功能**: 创建新项目并初始化所有阶段和活动状态
- **参数**:
  - `user_id: str` — 用户 ID
  - `request` — ProjectCreateRequest 请求对象，包含项目名称、团队规模、行业等
- **返回值**: `dict` — 创建后的项目详情
- **关键逻辑**:
  1. 调用 `determine_complexity` 自动判定复杂度
  2. 向 `projects` 表插入项目记录，初始阶段为 CONCEPT
  3. 遍历所有 STAGE_ORDER 阶段，为每个阶段在 `stage_states` 表创建状态记录（第一个阶段为 active，其余为 pending）
  4. 为每个阶段创建对应的活动记录（`activity_states` 表），初始状态为 pending
  5. 提交事务后返回 `get_project` 的结果

#### get_project(project_id)
- **功能**: 获取项目详情
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 项目详情字典，包含 id、name、description、complexity_tier、current_stage 等字段
- **关键逻辑**: 查询 `projects` 表（排除已软删除的记录），若不存在则抛出 404 异常

#### list_projects(user_id, status, page, page_size)
- **功能**: 分页获取用户的项目列表
- **参数**:
  - `user_id: str` — 用户 ID
  - `status: str | None` — 状态筛选（可选）
  - `page: int` — 页码（默认 1）
  - `page_size: int` — 每页条数（默认 20）
- **返回值**: `dict` — 包含 `items`（项目列表）、`total`（总数）、`page`、`page_size`
- **关键逻辑**: 先查询总数，再按 `created_at DESC` 排序分页返回

#### advance_stage(project_id)
- **功能**: 将项目推进到下一阶段
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 更新后的项目详情
- **关键逻辑**:
  1. 获取当前阶段，若已是最后阶段抛出 422 异常
  2. 检查当前阶段的门禁阻断项：遍历 `STAGE_GATES` 和 `EXIT_CRITERIA`，对每个 `is_blocking=True` 的检查项，查询 `stage_checklist_items` 表确认是否已完成
  3. 若有未完成的阻断项，抛出 422 异常并列出未完成项
  4. 将当前阶段状态标记为 `completed`，记录完成时间
  5. 将下一阶段状态标记为 `active`，记录开始时间
  6. 更新项目表的 `current_stage` 和 `progress`
  7. 提交事务

#### rollback_stage(project_id)
- **功能**: 将项目回退到上一阶段
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 更新后的项目详情
- **关键逻辑**:
  1. 获取当前阶段，若已是第一阶段抛出 422 异常
  2. 检查回退次数：查询 `gate_results` 表中 `vote='rollback'` 的记录数，若超过配置的最大回退次数则抛出异常
  3. 将当前阶段状态重置为 `pending`
  4. 将上一阶段状态重新激活为 `active`，清除完成时间
  5. 更新项目表的 `current_stage` 和 `progress`

#### get_stage_detail(project_id, stage)
- **功能**: 获取阶段详情，包括活动列表、门禁状态和侧边栏小组件
- **参数**:
  - `project_id: str` — 项目 ID
  - `stage: str` — 阶段名称
- **返回值**: `dict` — 包含 `stage`、`status`、`activities`、`gates`、`widgets`
- **关键逻辑**:
  1. 查询 `activity_states` 表获取该阶段所有活动，并从 `DEFAULT_ACTIVITIES` 中查找中文名称
  2. 查询 `gate_results` 表获取每个门禁的最新投票结果
  3. 返回预设的侧边栏小组件数据（预算、供应链、认证、竞品）

### get_current_stage_detail(project_id) [新增]
- **功能**: 获取项目当前阶段详情，供前端 `GET /api/projects/{id}/stage` 调用
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 调用 `get_stage_detail` 返回当前阶段详情
- **关键逻辑**: 先从 `get_project` 获取当前阶段，再委托给 `get_stage_detail`

### get_activities(project_id) [新增]
- **功能**: 获取当前阶段活动列表，供前端 `GET /api/projects/{id}/activities` 调用
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `list[dict]` — 活动列表，每个活动包含 id、key、name、status、human_input_required 等字段
- **关键逻辑**: 查询 `activity_states` 表，从 `DEFAULT_ACTIVITIES` 查找中文名称

### get_gates(project_id) [新增]
- **功能**: 获取当前阶段门禁状态，供前端 `GET /api/projects/{id}/gates` 调用
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `list[dict]` — 门禁状态列表，每个门禁包含 gate_id、status、criteria、is_auto_approved
- **关键逻辑**: 根据当前阶段获取门禁列表，查询 `gate_results` 表获取最新投票结果

### pause_project(project_id) [新增]
- **功能**: 暂停项目，供前端 `POST /api/projects/{id}/pause` 调用
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 更新后的项目详情
- **关键逻辑**: 仅 active 状态可暂停，将 status 设为 paused

### resume_project(project_id) [新增]
- **功能**: 恢复已暂停项目，供前端 `POST /api/projects/{id}/resume` 调用
- **参数**: `project_id: str` — 项目 ID
- **返回值**: `dict` — 更新后的项目详情
- **关键逻辑**: 仅 paused 状态可恢复，将 status 设为 active

### submit_gate_vote(project_id, gate_id, voter_role, vote, comment) [新增]
- **功能**: 提交门禁投票，供前端 `POST /api/projects/{id}/gates/{gate_id}/vote` 调用
- **参数**:
  - `project_id: str` — 项目 ID
  - `gate_id: str` — 门禁 ID
  - `voter_role: str` — 投票者角色
  - `vote: str` — 投票结果（approve/reject/abstain）
  - `comment: str` — 投票备注
- **返回值**: `dict` — 包含 gate_id、vote、voter_role、is_auto_approved、status
- **关键逻辑**:
  1. 检查单人模式：首个投票者自动通过（is_auto_approved=True）
  2. 向 `gate_results` 表插入投票记录（含 stage 字段）
  3. 返回投票结果

## 依赖关系
- `uuid` — 生成唯一 ID
- `datetime`, `timezone` — 时间戳处理
- `sqlalchemy.text` — 原生 SQL 查询
- `sqlalchemy.ext.asyncio.AsyncSession` — 异步数据库会话
- `shared.types.IPDStage`, `ComplexityTier` — IPD 阶段和复杂度枚举
- `shared.errors.ErrorCode`, `AppException` — 错误码和异常类
- `m0_infrastructure.config.get_settings` — 获取应用配置（如最大回退次数）

## 注意事项
- 所有数据库操作使用原生 SQL（`text()`），未使用 ORM 模型
- 项目使用软删除机制（`deleted_at IS NULL`），但删除逻辑在其他模块
- 复杂度判定目前仅影响 FULL 的判断，LITE 和 STANDARD 在活动裁剪上无差异（MVP 阶段）
- 门禁阻断检查依赖 `stage_checklist_items` 表，该表的数据填充由其他模块负责
- 侧边栏小组件数据目前为硬编码的占位数据，后续需要对接真实数据源
- 时间格式统一使用 `"%Y-%m-%d %H:%M:%S"` 字符串格式