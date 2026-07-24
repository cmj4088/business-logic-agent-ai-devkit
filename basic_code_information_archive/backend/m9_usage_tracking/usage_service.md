# usage_service.py — M9 用量追踪业务逻辑

## 概述
该文件是 M9 用量追踪模块的核心业务逻辑层，封装了所有与用量统计、限制管理和预算检查相关的数据库操作。`UsageService` 类是整个模块的唯一服务入口，路由器通过它间接操作数据库。

## 模块级常量

### MODEL_PRICING
- **功能**: 定义各 LLM 模型的定价（每 100 万 Token，单位：美元）。
- **格式**: `dict[str, tuple[float, float]]`，键为模型名称，值为 `(input_单价, output_单价)` 元组。
- **包含的模型**:
  - 免费模型（Ollama 本地）: `ollama`, `qwen2.5`, `llama3.2`, `deepseek-r1` — 均 (0.0, 0.0)。
  - Anthropic 付费模型: `claude-sonnet-4-5` (3.00, 15.00), `claude-haiku-4-5` (0.80, 4.00)。
  - OpenAI 付费模型: `gpt-4o` (2.50, 10.00), `gpt-4o-mini` (0.15, 0.60)。

## 模块级函数

### _get_model_pricing
- **功能**: 根据模型名称字符串查找对应的定价，支持模糊匹配。
- **参数**:
  - `model` (`str`): 模型名称。
- **返回值**: `tuple[float, float]` — `(input_单价, output_单价)`。
- **关键逻辑**:
  1. 先将模型名称转为小写，尝试精确匹配 `MODEL_PRICING` 字典。
  2. 若精确匹配失败，进行模糊匹配：
     - 包含 `ollama`, `qwen`, `llama`, `deepseek`, `mistral`, `phi` 关键字 → 免费 (0.0, 0.0)。
     - 包含 `claude`, `sonnet`, `haiku` 关键字 → Claude Sonnet 定价 (3.00, 15.00)。
     - 包含 `gpt`, `4o` 关键字 → GPT-4o 定价 (2.50, 10.00)。
  3. 都不匹配时，默认按轻量付费模型 (0.50, 2.00) 计算。
- **注意事项**: 模糊匹配的优先级顺序很重要，匹配到第一个关键字即返回，不会继续检查后续。

### _calculate_cost
- **功能**: 根据模型名称和输入/输出 Token 数计算出成本（美元）。
- **参数**:
  - `model` (`str`): 模型名称。
  - `input_tokens` (`int`): 输入 Token 数。
  - `output_tokens` (`int`): 输出 Token 数。
- **返回值**: `float` — 成本，保留 6 位小数。
- **关键逻辑**: 调用 `_get_model_pricing` 获取单价，分别计算输入成本和输出成本（公式: `tokens / 1_000_000 * price`），然后相加并四舍五入到 6 位小数。

## 类详细说明

### UsageService
- **功能**: 用量追踪服务类，封装所有用量相关的数据库查询和操作。
- **构造参数**:
  - `db` (`AsyncSession`): 异步数据库会话，由 FastAPI 依赖注入提供。

---

#### get_project_usage
- **功能**: 获取指定项目的用量统计，按模型维度聚合。
- **参数**:
  - `project_id` (`str`): 项目 ID。
- **返回值**: `dict`，包含以下字段：
  - `project_id` (`str`): 项目 ID。
  - `total_tokens` (`int`): 总 Token 数。
  - `total_input_tokens` (`int`): 总输入 Token 数。
  - `total_output_tokens` (`int`): 总输出 Token 数。
  - `total_cost` (`float`): 总成本。
  - `record_count` (`int`): 用量记录总数。
  - `by_model` (`list[dict]`): 按模型分布的数据，每个元素包含 `model`, `tokens`, `input_tokens`, `output_tokens`, `cost`, `count`。
- **关键逻辑**:
  1. 使用原生 SQL 从 `usage_records` 表按 `model` 分组聚合。
  2. 如果查询结果为空，返回所有字段为 0/空列表的默认值。
  3. 遍历查询结果，累积计算总 Token、总输入、总输出、总成本和总记录数。
  4. 成本值统一保留 6 位小数。

#### get_summary
- **功能**: 获取全局用量摘要，聚合所有项目的数据。
- **参数**: 无（仅使用 `self.db`）。
- **返回值**: `dict`，包含以下字段：
  - `total_tokens` (`int`): 全局总 Token。
  - `total_input_tokens` (`int`): 全局总输入 Token。
  - `total_output_tokens` (`int`): 全局总输出 Token。
  - `total_cost` (`float`): 全局总成本。
  - `total_records` (`int`): 全局用量记录总数。
  - `active_projects` (`int`): 有用量记录的项目数。
  - `period` (`str`): 固定为 `"monthly"`。
- **关键逻辑**:
  1. 执行两次查询：一次聚合 `usage_records` 的全局统计，一次查询去重项目数。
  2. 使用 `COALESCE` 处理空值，确保返回 0 而非 None。
  3. 目前 `period` 字段固定为 `"monthly"`，未做周期性筛选。

#### get_daily_trend
- **功能**: 获取每日用量趋势，用于绘制折线图或柱状图。
- **参数**:
  - `days` (`int`): 回溯天数，默认 30。
- **返回值**: `list[dict]`，每个元素包含 `date`, `total_tokens`, `total_input_tokens`, `total_output_tokens`, `total_cost`, `record_count`。
- **关键逻辑**:
  1. 使用 SQLite 的 `DATE('now', '-N days')` 语法过滤时间范围。
  2. 按 `DATE(created_at)` 分组，按日期升序排列。
  3. 遍历结果构建趋势数据列表。

#### get_limits
- **功能**: 获取当前所有用量限制配置。
- **参数**: 无。
- **返回值**: `dict`，包含 `limits` 键，其值为限制对象列表，每个对象有 `id`, `limit_type`, `max_tokens`, `period`, `is_active`, `created_at`。
- **关键逻辑**:
  1. 从 `usage_limits` 表查询所有记录，按创建时间降序排列。
  2. `is_active` 字段显式转为 `bool` 类型（数据库存储为 0/1）。

#### update_limits
- **功能**: 创建新的用量限制记录。
- **参数**:
  - `max_tokens` (`int`): 最大 Token 数。
  - `period` (`str`): 默认 `"monthly"`，限制周期。
  - `is_active` (`bool`): 默认 `True`，是否启用。
- **返回值**: `dict`，包含新创建的限制记录（`id`, `limit_type`, `max_tokens`, `period`, `is_active`, `created_at`）。
- **关键逻辑**:
  1. 使用 `uuid.uuid4()` 生成唯一 ID。
  2. 使用 `datetime.now(timezone.utc)` 获取当前 UTC 时间。
  3. `is_active` 布尔值转为整数 0/1 存入数据库。
  4. 每次调用都会 INSERT 一条新记录，不会覆盖旧记录。
  5. 执行 `commit()` 提交事务。

#### check_budget
- **功能**: 检查项目预算使用状态，实现 80% 警告、100% 阻止的预算策略。
- **参数**:
  - `project_id` (`str`): 项目 ID。
- **返回值**: `dict`，包含以下字段：
  - `project_id` (`str`): 项目 ID。
  - `budget_limit` (`float`): 项目的预算上限（从 `projects` 表 `budget_limit` 字段读取）。
  - `total_cost` (`float`): 项目当前总花费（从 `usage_records` 表聚合）。
  - `usage_percent` (`float`): 使用百分比，保留 2 位小数。
  - `status` (`str`): 状态 — `"ok"`（正常）、`"warning"`（80% 以上）、`"blocked"`（100% 以上）。
  - `message` (`str`): 人类可读的状态描述。
- **关键逻辑**:
  1. 先从 `projects` 表查询项目的 `budget_limit`。
  2. 如果项目不存在，返回 `budget_limit=0`, `status="ok"`, `message="项目不存在"`。
  3. 从 `usage_records` 表查询该项目的总花费。
  4. 如果 `budget_limit <= 0`，表示未设置预算限制，返回正常状态。
  5. 计算使用百分比 `(total_cost / budget_limit) * 100`。
  6. 根据百分比判断状态：>= 100% 为 `blocked`，>= 80% 为 `warning`，否则为 `ok`。
  7. 所有状态消息使用美元格式化 `$xx.xx`。

## 依赖关系
- `uuid`: 生成唯一 ID。
- `datetime.datetime`, `datetime.timezone`, `datetime.timedelta`: 时间处理。
- `sqlalchemy.text`: 执行原生 SQL 语句。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。

## 注意事项
- 该模块使用原生 SQL（`text()`）而非 ORM 查询，优点是 SQL 语义清晰，缺点是缺乏 ORM 的类型安全。
- SQL 语法针对 SQLite 编写（如 `DATE('now', '-N days')`），迁移到其他数据库（如 PostgreSQL）时需要调整日期函数。
- `get_summary` 中的 `period` 字段固定为 `"monthly"`，目前未实现根据实际查询周期动态设置。
- `update_limits` 每次都新增记录而非更新已有记录，这意味着历史限制配置会保留，但前端需要自行决定如何展示最新/生效的限制。
- 模型定价表 `MODEL_PRICING` 是硬编码的，新增模型时需要手动更新此字典和 `_get_model_pricing` 的模糊匹配逻辑。
- `_get_model_pricing` 中"默认轻量付费模型"价格为 (0.50, 2.00) 美元/百万 Token，这是一个估计值，实际未知模型可能需要管理员手动确认。