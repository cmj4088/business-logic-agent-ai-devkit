# models.py — Pydantic 请求/响应模型

## 概述
该文件定义了 M6 审核系统的 Pydantic 请求模型，用于验证审核相关 API 的请求体。包含投票请求、批量审核请求和升级请求三种模型，所有模型均使用 Pydantic 的 `BaseModel` 和 `Field` 进行声明式定义。

## 函数/类详细说明

### VoteRequest
- **功能**: 单个投票/审核请求的请求体模型。
- **字段**:
  - `gate_id` (str): 必填，门禁 ID，指定对哪个门禁进行投票。
  - `vote` (str): 必填，投票结果，可选值为 `approve`（通过）、`reject`（驳回）、`request_changes`（要求修改）。
  - `comment` (str): 审核意见，默认为空字符串。
- **关键逻辑**:
  - `vote` 字段的有效值在服务层（`ReviewService.submit_vote`）中进行校验，而非模型层。
  - `comment` 在单人模式下会被自动替换为 `auto_approved_due_to_single_user_mode`。

### BatchReviewRequest
- **功能**: 批量审核请求的请求体模型。
- **字段**:
  - `review_ids` (list[str]): 必填，需要批量审核的审核任务 ID 列表。
  - `vote` (str): 必填，批量投票结果，可选值为 `approve`（通过）或 `reject`（驳回）。
- **关键逻辑**:
  - 批量审核的 `vote` 可选值比单个投票少一个 `request_changes` 选项。
  - 服务层会遍历 `review_ids` 列表，逐个处理每个审核任务。

### EscalateRequest
- **功能**: 审核升级请求的请求体模型。
- **字段**:
  - `reason` (str): 必填，升级原因，用于说明为何需要将审核升级处理。
- **关键逻辑**:
  - 升级操作会将审核任务状态设为 `escalated`，并自动创建一个遗留问题（`review_issues`）记录。

## 依赖关系
- `pydantic.BaseModel` / `Field`: 模型基类和字段声明。

## 注意事项
- 所有模型仅用于请求验证，响应模型直接使用 Python 字典。
- `VoteRequest` 和 `BatchReviewRequest` 中的 `vote` 字段只做了 Pydantic 层面的类型校验，具体有效值校验在服务层执行。
- 模型中没有用户身份字段，因为用户信息通过 `get_current_user` 依赖注入获取，不依赖请求体传入。