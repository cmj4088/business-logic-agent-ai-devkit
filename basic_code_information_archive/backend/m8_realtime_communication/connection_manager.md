# connection_manager.py — WebSocket 连接管理器

## 概述
该文件是 M8 实时通信模块的核心基础设施，实现了 WebSocket 连接池的管理。`ConnectionManager` 类负责连接的注册/注销、心跳检测、消息广播（按通道或按项目）以及单播。采用全局单例模式，确保整个应用内只有一个连接管理器实例。

## 类详细说明

### ConnectionEntry
- **功能**: 单条 WebSocket 连接记录的数据结构。
- **属性**:
  - `websocket` (`WebSocket`): WebSocket 连接实例。
  - `project_id` (`str | None`): 关联的项目 ID，可选。
  - `channel` (`str | None`): 关联的通道名称，可选。
  - `last_pong` (`float`): 最后一次收到 pong 的时间戳（通过 `asyncio.get_event_loop().time()` 获取）。
- **关键逻辑**: 纯数据类，用于在连接池中追踪每个连接的状态和归属。

### ConnectionManager
- **功能**: WebSocket 连接管理器，负责连接池管理和消息分发。

#### 构造函数 `__init__()`
- **功能**: 初始化连接管理器，从配置中读取参数。
- **关键逻辑**:
  - `max_connections`: 从 `settings.ws_max_connections` 读取最大并发连接数。
  - `heartbeat_interval`: 从 `settings.ws_heartbeat_interval` 读取心跳间隔（秒）。
  - `_connections`: 连接池列表，存储 `ConnectionEntry` 对象。
  - `_heartbeat_task`: 心跳后台任务引用，初始为 `None`。
  - `_lock`: `asyncio.Lock` 异步锁，保证连接池操作的线程安全。

#### 连接管理

##### connect(websocket, project_id, channel)
- **功能**: 接受 WebSocket 连接并注册到连接池。
- **参数**:
  - `websocket` (`WebSocket`): WebSocket 连接实例。
  - `project_id` (`str | None`): 关联的项目 ID，可选。
  - `channel` (`str | None`): 关联的通道名称，可选。
- **返回值**: `None`。
- **异常**:
  - `AppException(503)`: 连接数达到上限时拒绝连接，关闭码 1013。
- **关键逻辑**:
  1. 加锁检查连接数是否超限，超限则关闭 WebSocket（code=1013, reason="连接数已达上限"）并抛出异常。
  2. 调用 `websocket.accept()` 接受连接。
  3. 创建 `ConnectionEntry` 并加入连接池。
  4. 首次连接时启动心跳后台任务 `_heartbeat_loop`。

##### disconnect(websocket)
- **功能**: 从连接池中移除指定连接。
- **参数**:
  - `websocket` (`WebSocket`): 要断开的 WebSocket 连接。
- **返回值**: `None`。
- **关键逻辑**:
  1. 加锁后使用列表推导式过滤掉目标连接。
  2. 安全关闭 WebSocket：先检查 `client_state` 是否已断开，避免重复关闭。
  3. 关闭异常被静默忽略。

#### 消息发送

##### broadcast(channel, message)
- **功能**: 向指定通道内所有连接广播消息。
- **参数**:
  - `channel` (`str`): 目标通道名称。
  - `message` (`dict[str, Any]`): 要发送的消息字典。
- **返回值**: `None`。
- **关键逻辑**:
  1. 将消息序列化为 JSON 字符串。
  2. 遍历连接池，筛选出 `channel` 匹配的连接。
  3. 使用 `asyncio.gather` 并发发送，`return_exceptions=True` 确保单个失败不影响其他连接。

##### send_to_project(project_id, message)
- **功能**: 向指定项目的所有连接发送消息。
- **参数**:
  - `project_id` (`str`): 目标项目 ID。
  - `message` (`dict[str, Any]`): 要发送的消息字典。
- **返回值**: `None`。
- **关键逻辑**: 与 `broadcast` 类似，但按 `project_id` 筛选连接。

##### send_personal(websocket, message)
- **功能**: 向单个 WebSocket 连接发送消息（单播）。
- **参数**:
  - `websocket` (`WebSocket`): 目标 WebSocket 连接。
  - `message` (`dict[str, Any]`): 要发送的消息字典。
- **返回值**: `None`。
- **关键逻辑**: 直接调用 `_safe_send` 发送，不遍历连接池。

#### 心跳

##### _heartbeat_loop()
- **功能**: 后台心跳循环，定期发送 ping 并清理死连接。
- **参数**: 无。
- **返回值**: `None`（无限循环）。
- **关键逻辑**:
  1. 每 `heartbeat_interval` 秒执行一次循环。
  2. 遍历所有连接，检查 `client_state` 是否为 `DISCONNECTED`。
  3. 向活跃连接发送 `{"type": "ping"}` JSON 消息。
  4. 收集已断开或发送失败的连接，从池中移除。
  5. 发送 ping 失败时也标记为死连接。

#### 内部辅助

##### _safe_send(websocket, payload)
- **功能**: 安全发送消息，自动处理断开连接。
- **参数**:
  - `websocket` (`WebSocket`): 目标 WebSocket 连接。
  - `payload` (`str`): JSON 字符串。
- **返回值**: `None`。
- **关键逻辑**:
  1. 先检查 `client_state` 是否为 `DISCONNECTED`。
  2. 发送失败时自动调用 `disconnect` 清理连接。
  3. 所有异常被静默捕获。

## 全局单例

```python
manager = ConnectionManager()
```

整个应用共享一个 `manager` 实例，在 `router.py` 中直接导入使用。

## 依赖关系
- `asyncio`: 异步锁、后台任务、事件循环。
- `json`: JSON 序列化。
- `logging`: 日志记录。
- `fastapi.WebSocket`: WebSocket 连接类型。
- `starlette.websockets.WebSocketState`: WebSocket 状态枚举。
- `shared.config.get_settings`: 应用配置读取。
- `shared.errors.AppException, ErrorCode`: 统一错误处理。

## 注意事项
- `_connections` 使用普通列表而非字典，筛选时需遍历所有连接，连接数较大时可能有性能影响。
- 心跳任务仅启动一次（首次连接时），即使所有连接断开也不会自动停止。
- `ConnectionEntry.last_pong` 字段被定义但当前心跳循环中未使用（未实现 pong 超时检测逻辑）。
- `broadcast` 和 `send_to_project` 使用 `return_exceptions=True`，单个连接发送失败不会导致整体广播中断。
- 加锁操作覆盖了遍历和修改连接池的整个过程，在高并发场景下可能成为瓶颈。
- WebSocket 关闭码 1013 在 RFC 6455 中表示 "Try Again Later"（服务暂时过载）。