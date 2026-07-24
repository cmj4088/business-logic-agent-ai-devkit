# recovery_manager.py — M10 异常恢复管理器

## 概述
该文件是 M10 异常恢复模块的核心业务逻辑层，定义了 `RecoveryManager` 类，负责处理项目中出现的 4 种主要异常场景：Agent 产出质量差、辩论死循环、LLM 不可用和门禁反复不通过。同时提供恢复状态查询、恢复动作执行与追踪功能。

## 模块级常量

### ACTION_TYPES
- **功能**: 定义所有支持的恢复动作类型及其中文描述。
- **内容**:
  | 键 | 值（中文描述） |
  |---|---|
  | `regenerate_artifact` | 重新生成产出物 |
  | `resolve_deadlock` | 辩论死锁裁决 |
  | `switch_model` | 切换 LLM 模型 |
  | `proceed_with_issues` | 带着遗留问题前进 |
  | `retry_stage` | 重试当前阶段 |
  | `rollback_stage` | 回退到上一阶段 |
  | `manual_intervention` | 人工干预 |

### DEADLOCK_RESOLUTIONS
- **功能**: 定义辩论死锁的三种裁决方式及其中文描述。
- **内容**:
  | 键 | 值（中文描述） |
  |---|---|
  | `moderator_decide` | 主持人裁决 |
  | `restart` | 重新开始辩论 |
  | `proceed` | 忽略死锁继续 |

## 模块级工具函数

### _now
- **功能**: 返回当前 UTC 时间的格式化字符串。
- **参数**: 无。
- **返回值**: `str` — 格式为 `"YYYY-MM-DD HH:MM:SS"` 的 UTC 时间字符串。
- **关键逻辑**: 使用 `datetime.now(timezone.utc)` 获取 UTC 时间，避免时区问题。

### _generate_id
- **功能**: 生成带前缀的唯一 ID。
- **参数**:
  - `prefix` (`str`): ID 前缀，默认为空字符串。
- **返回值**: `str` — 格式为 `"<prefix><12位随机十六进制>"` 的唯一 ID。
- **关键逻辑**: 使用 `uuid.uuid4().hex[:12]` 截取前 12 位十六进制字符，兼顾唯一性和长度。

## 类详细说明

### RecoveryManager
- **功能**: 异常恢复管理器，处理项目中出现的各类异常，提供恢复机制和状态追踪。
- **构造参数**:
  - `db` (`AsyncSession`): 异步数据库会话。

---

## 恢复状态查询

### get_recovery_status
- **功能**: 获取当前项目的恢复状态，包括进行中的动作、最近的动作记录和摘要统计。
- **参数**:
  - `project_id` (`str`): 项目 ID。
- **返回值**: `dict`，包含以下字段：
  - `project_id` (`str`): 项目 ID。
  - `status` (`str`): 整体状态 — `"正常"`（无进行中动作）、`"恢复中"`（有进行中动作）、`"已恢复"`（最近动作已完成）。
  - `active_actions` (`list[dict]`): 进行中的恢复动作列表（`status='in_progress'`）。
  - `recent_actions` (`list[dict]`): 最近的恢复动作列表（最近 10 条，不限状态）。
  - `summary` (`dict`): 恢复摘要，含 `total_actions`, `action_counts`, `gate_failure_count`。
- **关键逻辑**:
  1. 查询 `recovery_actions` 表中 `status='in_progress'` 的记录作为活跃动作。
  2. 查询最近 10 条恢复动作记录（不限状态）。
  3. 调用 `_build_summary` 构建摘要。
  4. 根据活跃动作和最近动作的状态判断整体状态。

### _build_summary
- **功能**: 构建恢复摘要信息，统计各类恢复动作数量和门禁失败次数。
- **参数**:
  - `project_id` (`str`): 项目 ID。
- **返回值**: `dict`，包含 `total_actions`（总动作数）、`action_counts`（按类型分布）、`gate_failure_count`（门禁失败次数）。
- **关键逻辑**:
  1. 按 `action_type` 分组统计 `recovery_actions` 表中的记录数。
  2. 查询 `gate_results` 表中 `vote='reject'` 的记录数作为门禁失败次数。

---

## 执行恢复动作

### execute_action
- **功能**: 执行指定的恢复动作，记录动作到数据库并分发到具体处理逻辑。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `action_type` (`str`): 动作类型，必须是 `ACTION_TYPES` 中的键。
  - `params` (`dict`): 动作参数。
- **返回值**: `dict`，包含 `action_id`, `action_type`, `status`, `result`。
- **关键逻辑**:
  1. 校验 `action_type` 是否合法，不合法则抛出 `AppException`（状态码 400）。
  2. 生成 `action_id`（前缀 `recovery_`），记录当前时间。
  3. 向 `recovery_actions` 表插入一条 `status='in_progress'` 的记录。
  4. 调用 `_dispatch_action` 分发到具体处理逻辑。
  5. 成功则调用 `_mark_action_completed` 更新状态为 `completed`。
  6. 失败则调用 `_mark_action_failed` 更新状态为 `failed`，然后重新抛出异常。

### _dispatch_action
- **功能**: 根据动作类型将请求分发到对应的处理函数。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `action_type` (`str`): 动作类型。
  - `params` (`dict`): 动作参数。
- **返回值**: `dict` — 各处理函数的执行结果。
- **关键逻辑**:
  1. `regenerate_artifact`: 需要 `artifact_id` 参数，可选 `temperature` 和 `model`。
  2. `resolve_deadlock`: 需要 `round_id` 参数，可选 `resolution`（默认 `moderator_decide`）。
  3. `switch_model`: 无强制参数。
  4. `proceed_with_issues`: 需要 `gate_id` 参数，可选 `accepted_issue_ids`。
  5. `retry_stage`, `rollback_stage`, `manual_intervention`: 直接调用对应处理函数。

---

## 场景 1: Agent 产出质量差 — 重新生成产出物

### regenerate_artifact
- **功能**: 重新生成产出物的公共接口，将当前版本保存到 `artifact_versions` 表，递增版本号。
- **参数**:
  - `artifact_id` (`str`): 产出物 ID。
  - `temperature` (`float`): 默认 0.9，重试温度。
  - `model` (`str`): 默认 `"ollama"`，使用的模型。
- **返回值**: `dict`，包含 `artifact_id`, `artifact_name`, `old_version`, `new_version`, `old_version_saved_as`, `temperature`, `model`, `message`。
- **关键逻辑**: 直接委托给 `_handle_regenerate_artifact`。

### _handle_regenerate_artifact
- **功能**: 处理产出物重新生成的核心逻辑。
- **参数**:
  - `artifact_id` (`str`): 产出物 ID。
  - `temperature` (`float`): 重试温度。
  - `model` (`str`): 使用的模型。
- **返回值**: `dict` — 重新生成结果。
- **关键逻辑**:
  1. 从 `artifacts` 表查询当前产出物（排除已删除的 `deleted_at IS NULL`）。
  2. 如果不存在，抛出 `AppException`（状态码 404）。
  3. 获取旧版本号和旧内容，新版本号 = 旧版本号 + 1。
  4. 将旧版本内容保存到 `artifact_versions` 表（ID 前缀 `av_`）。
  5. 更新 `artifacts` 表的 `version` 和 `updated_at`。
  6. 提交事务，返回版本信息。
- **注意事项**: 实际的内容重新生成逻辑由 M4 编排模块负责，本方法只做版本管理和记录保留。

---

## 场景 2: 辩论死循环 — 裁决/重启/放行

### resolve_debate_deadlock
- **功能**: 辩论死锁裁决的公共接口。
- **参数**:
  - `round_id` (`str`): 辩论轮次 ID。
  - `resolution` (`str`): 裁决方式，必须是 `DEADLOCK_RESOLUTIONS` 中的键。
- **返回值**: `dict` — 裁决结果。
- **关键逻辑**:
  1. 校验 `resolution` 是否合法，不合法则抛出 `AppException`（状态码 400）。
  2. 委托给 `_handle_resolve_deadlock`。

### _handle_resolve_deadlock
- **功能**: 处理辩论死锁裁决的核心逻辑。
- **参数**:
  - `round_id` (`str`): 辩论轮次 ID。
  - `resolution` (`str`): 裁决方式。
- **返回值**: `dict` — 裁决结果，包含 `round_id`, `resolution`, `action`, `resolved_at`。
- **关键逻辑**:
  1. `moderator_decide`: 返回"主持人已做出裁决"，辩论结束。
  2. `restart`: 生成新的 `round_id`（前缀 `round_`），返回"重新开始辩论"。
  3. `proceed`: 返回"忽略死锁继续推进"。
- **注意事项**: 该函数当前只返回状态信息，不实际操作数据库中的辩论记录。辩论的实际控制逻辑由 M4 编排模块负责。

---

## 场景 3: LLM 不可用 — 切换模型/熔断降级

### _handle_switch_model
- **功能**: 处理 LLM 模型切换，当主模型不可用时切换到备用模型链。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `params` (`dict`): 包含 `current_model`（当前模型）和 `fallback_chain`（降级链）。
- **返回值**: `dict`，包含 `project_id`, `action`, `current_model`, `fallback_chain`, `status`, `message`。
- **关键逻辑**:
  1. 从 `params` 中获取 `current_model`（默认 `"ollama"`）和 `fallback_chain`。
  2. 如果未提供降级链，根据当前模型自动生成默认降级链：
     - `ollama` 不可用 → `["anthropic", "openai"]`
     - `anthropic` 不可用 → `["openai", "ollama"]`
     - 其他 → `["ollama", "anthropic"]`
  3. 返回切换结果，包含降级链信息。
- **注意事项**: 该函数只返回降级链建议，实际的模型切换需要由 M3 LLM 交互模块执行。

---

## 场景 4: 门禁反复不通过 — 带着遗留问题前进

### proceed_with_issues
- **功能**: 带着遗留问题前进的公共接口。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `gate_id` (`str`): 门禁 ID。
  - `accepted_issue_ids` (`list[str] | None`): 接受的问题 ID 列表，可选。
  - `reason` (`str`): 决策理由，默认为空字符串。
- **返回值**: `dict` — 处理结果。
- **关键逻辑**: 委托给 `_handle_proceed_with_issues`。

### _handle_proceed_with_issues
- **功能**: 处理带着遗留问题前进的核心逻辑。将问题标记为"已接受(遗留)"，门禁标记为"有条件通过"。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `gate_id` (`str`): 门禁 ID。
  - `accepted_issue_ids` (`list[str]`): 接受的问题 ID 列表。
  - `reason` (`str`): 决策理由。
- **返回值**: `dict`，包含 `project_id`, `gate_id`, `accepted_issues`, `issue_ids`, `reason`, `message`。
- **关键逻辑**:
  1. 如果提供了 `accepted_issue_ids`，只查询列表中的问题；否则查询该门禁下所有 `status='open'` 的问题。
  2. 如果没有待处理的问题，抛出 `AppException`（状态码 404）。
  3. 将 `review_issues` 表中相关问题的 `status` 更新为 `'accepted_legacy'`，记录 `resolved_at`。
  4. 将 `gate_results` 表中对应门禁的 `vote` 更新为 `'conditional_pass'`，在 `comment` 中记录理由。
  5. 提交事务，返回处理结果。

---

## 其他恢复动作

### _handle_retry_stage
- **功能**: 重试当前阶段。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `params` (`dict`): 包含 `stage`（阶段名称）。
- **返回值**: `dict`，包含 `project_id`, `action`, `stage`, `message`。
- **关键逻辑**: 只返回状态信息，不操作数据库。实际的重试逻辑由 M4 编排模块负责。

### _handle_rollback_stage
- **功能**: 回退到上一阶段。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `params` (`dict`): 包含 `target_stage`（目标阶段）。
- **返回值**: `dict`，包含 `project_id`, `action`, `target_stage`, `message`。
- **关键逻辑**: 只返回状态信息，不操作数据库。实际的回退逻辑由 M4 编排模块负责。

### _handle_manual_intervention
- **功能**: 人工干预请求。
- **参数**:
  - `project_id` (`str`): 项目 ID。
  - `params` (`dict`): 包含 `description`（干预描述）。
- **返回值**: `dict`，包含 `project_id`, `action`, `description`, `message`。
- **关键逻辑**: 只返回状态信息，实际的干预需要人工介入。

---

## 内部辅助方法

### _mark_action_completed
- **功能**: 将恢复动作标记为已完成，写入执行结果。
- **参数**:
  - `action_id` (`str`): 动作 ID。
  - `result` (`dict`): 执行结果字典。
- **返回值**: `None`。
- **关键逻辑**:
  1. 将 `result` 字典序列化为 JSON 字符串。
  2. 更新 `recovery_actions` 表中对应记录的 `status='completed'`, `result`, `updated_at`。
  3. 提交事务。

### _mark_action_failed
- **功能**: 将恢复动作标记为失败，记录错误信息。
- **参数**:
  - `action_id` (`str`): 动作 ID。
  - `error` (`str`): 错误信息字符串。
- **返回值**: `None`。
- **关键逻辑**:
  1. 将错误信息包装为 JSON `{"error": "..."}`。
  2. 更新 `recovery_actions` 表中对应记录的 `status='failed'`, `result`, `updated_at`。
  3. 提交事务。

## 依赖关系
- `uuid`: 生成唯一 ID。
- `datetime.datetime`, `datetime.timezone`: 时间处理。
- `json`: JSON 序列化（在 `_mark_action_completed` 中使用）。
- `sqlalchemy.text`: 执行原生 SQL 语句。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。
- `shared.errors.ErrorCode`, `shared.errors.AppException`: 统一的错误码和异常类。

## 注意事项
- 该模块使用原生 SQL（`text()`）而非 ORM 查询，SQL 语法针对 SQLite 编写。
- 大部分恢复动作（`retry_stage`, `rollback_stage`, `manual_intervention`）只返回状态信息，不实际操作数据库或执行恢复逻辑，真正的恢复需要由 M4 编排模块配合实现。
- `_handle_switch_model` 只返回降级链建议，实际的模型切换逻辑不在本模块中。
- `_handle_resolve_deadlock` 不操作数据库中的辩论记录，只返回裁决结果。
- `execute_action` 中，如果处理逻辑抛出异常，会先调用 `_mark_action_failed` 记录失败，然后重新抛出异常，确保异常不会被静默吞掉。
- `_mark_action_failed` 中的错误信息拼接使用了 f-string 而非 `json.dumps`，包含特殊字符的错误信息可能导致 JSON 格式异常。
- `get_recovery_status` 中通过索引访问 `row[0]`, `row[1]` 等获取字段值，这种方式依赖列顺序，如果 SQL 查询列顺序变更会导致错误。建议使用 `.key` 或命名元组方式访问。
- `_build_summary` 同样使用索引方式访问查询结果。