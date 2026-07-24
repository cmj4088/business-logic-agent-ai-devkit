# models.py — M10 异常恢复 Pydantic 数据模型

## 概述
该文件定义了 M10 异常恢复模块中使用的所有 Pydantic 请求/响应模型。涵盖了恢复动作执行、辩论死锁裁决、产出物重新生成和带着遗留问题前进等四种核心异常场景的请求体，以及恢复状态查询的响应体。

## 类详细说明

### RecoveryActionRequest
- **功能**: 通用恢复动作的请求体，用于 POST `/api/recovery/actions` 端点。
- **字段**:
  - `action_type` (`str`): 必填，恢复动作类型。可选值包括 `regenerate_artifact`, `resolve_deadlock`, `switch_model`, `proceed_with_issues`, `retry_stage`, `rollback_stage`, `manual_intervention`。
  - `params` (`dict`): 选填，默认为空字典。动作参数，具体内容取决于动作类型。例如 `regenerate_artifact` 需要 `{"artifact_id": "...", "project_id": "..."}`。
- **关键逻辑**: 这是一个通用请求体，通过 `action_type` 区分具体动作，`params` 字典承载各动作的定制参数。

### DebateResolveRequest
- **功能**: 辩论死锁裁决的请求体，用于 POST `/api/recovery/debate/{round_id}/resolve` 端点。
- **字段**:
  - `round_id` (`str`): 必填，辩论轮次 ID，指明哪一轮辩论发生了死锁。
  - `resolution` (`str`): 必填，裁决方式。可选值：`moderator_decide`（主持人裁决）、`restart`（重新开始辩论）、`proceed`（忽略死锁继续）。
- **关键逻辑**: 该模型同时包含 `round_id` 字段，但路由中 `round_id` 也作为路径参数传入，实际使用时以路径参数为准。

### RegenerateRequest
- **功能**: 重新生成产出物的请求体，用于 POST `/api/recovery/regenerate/{artifact_id}` 端点。
- **字段**:
  - `artifact_id` (`str`): 必填，产出物 ID。
  - `temperature` (`float`): 选填，默认值 0.9，范围 0.0~2.0。重试时的温度参数，提高温度可增加输出的随机性。
  - `model` (`str`): 选填，默认值 `"ollama"`。重新生成时使用的模型。
- **关键逻辑**: `temperature` 字段通过 `Field(ge=0.0, le=2.0)` 做了范围校验，防止传入无效值。

### ProceedWithIssuesRequest
- **功能**: 带着遗留问题前进的请求体，用于 POST `/api/recovery/proceed-with-issues` 端点。
- **字段**:
  - `project_id` (`str`): 必填，项目 ID。
  - `gate_id` (`str`): 必填，门禁 ID，指明哪个门禁反复不通过。
  - `reason` (`str`): 选填，默认为空字符串。决策理由，记录为什么接受遗留问题。
  - `accepted_issue_ids` (`list[str]`): 选填，默认为空列表。接受的问题 ID 列表。如果为空，服务层会获取该门禁下所有未解决的问题。
- **关键逻辑**: 使用 `list[str]` 类型，若未提供 `accepted_issue_ids`，服务层会自动获取所有 `status='open'` 的问题。

### RecoveryStatusResponse
- **功能**: 恢复状态的响应模型，定义了恢复状态查询返回的数据结构。
- **字段**:
  - `project_id` (`str`): 必填，项目 ID。
  - `status` (`str`): 必填，当前恢复状态。可选值：`"正常"`、`"恢复中"`、`"已恢复"`。
  - `active_actions` (`list[dict]`): 选填，默认为空列表。进行中的恢复动作列表。
  - `recent_actions` (`list[dict]`): 选填，默认为空列表。最近的恢复动作列表（最多 10 条）。
  - `summary` (`dict`): 选填，默认为空字典。恢复摘要，包含 `total_actions`, `action_counts`, `gate_failure_count`。
- **关键逻辑**: 这是一个响应模型，定义了 API 返回数据的结构，但路由中实际返回的是手动构造的字典，并未直接使用此模型进行序列化。

## 依赖关系
- `typing.Optional`: 可选类型标注（虽然文件中未实际使用）。
- `pydantic.BaseModel`: 基础模型类。
- `pydantic.Field`: 字段级别的元数据定义和校验规则。

## 注意事项
- `RecoveryStatusResponse` 模型定义了但路由中并未直接使用它来构造响应，路由仍使用手动构造字典的方式返回。如需更好的类型安全，建议在路由返回值中使用此模型。
- `DebateResolveRequest` 中的 `round_id` 字段与路由路径参数 `round_id` 重复，可能导致混淆，建议从请求体中移除 `round_id` 或统一使用路径参数。
- `RegenerateRequest` 中的 `artifact_id` 字段同样与路径参数重复。
- 所有请求模型都使用了 Pydantic 的 `Field` 描述信息，方便生成 OpenAPI 文档。