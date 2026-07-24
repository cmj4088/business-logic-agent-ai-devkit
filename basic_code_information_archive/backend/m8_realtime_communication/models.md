# models.py — M8 实时通信数据模型

## 概述
该文件是 M8 实时通信模块的数据模型层，定义了 WebSocket 通信中使用的统一消息格式 `WSMessage`。该模型基于 Pydantic，用于在服务端解析客户端发送的 JSON 消息，确保消息结构的一致性和类型安全。

## 类详细说明

### WSMessage
- **功能**: WebSocket 消息统一模型，用于解析客户端通过 WebSocket 发送的 JSON 消息。
- **字段**:
  - `type` (`str`): 消息类型，必填。支持的类型包括：
    - `subscribe` — 订阅通道
    - `unsubscribe` — 取消订阅通道
    - `agent_token` — Agent 思考令牌
    - `stage_update` — IPD 阶段状态更新
    - `widget_update` — Widget 实时更新
    - `notification` — 系统通知
    - `error` — 错误消息
    - `ping` / `pong` — 心跳消息
  - `channel` (`Optional[str]`): 目标通道名称，可选。用于指定消息发送的目标通道。
  - `project_id` (`Optional[str]`): 所属项目 ID，可选。用于关联消息到特定项目。
  - `data` (`Optional[dict]`): 消息载荷，可选。承载具体的业务数据。
- **关键逻辑**: 使用 `model_validate_json(raw)` 方法从 WebSocket 接收的原始 JSON 字符串解析为 `WSMessage` 对象，解析失败时返回错误消息。
- **使用方式**: 在 `router.py` 的 `_ws_lifecycle` 函数中，通过 `WSMessage.model_validate_json(raw)` 解析客户端消息。

## 依赖关系
- `typing.Optional`: 可选类型标注。
- `pydantic.BaseModel, Field`: 基础模型类和字段定义。

## 注意事项
- 该模型仅用于解析客户端发来的消息，不用于服务端发送的消息（服务端直接构造 `dict` 发送）。
- `type` 字段的注释中列出了所有支持的消息类型，但实际路由中仅处理了 `subscribe`、`unsubscribe` 和 `pong`，其余类型（如 `agent_token`、`stage_update` 等）会被广播到当前通道。
- 所有可选字段默认为 `None`，客户端可以根据消息类型按需传入。
- 模型定义简洁，当前版本未使用 `Field` 的高级约束（如 `min_length`、`pattern` 等）。