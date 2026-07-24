# 实时通信模块（M8）代码说明

## 概述
M8 实时通信模块提供 5 个 WebSocket 通道、1 个 SSE（Server-Sent Events）降级端点和 1 个 Dashboard 聚合 REST API 端点。所有 WebSocket 端点通过 URL 查询参数进行 JWT Token 认证，共享通用的生命周期管理逻辑。

## 文件: router.py
- **路径**: `backend/m8_realtime_communication/router.py`
- **作用**: M8 实时通信模块的 HTTP/WebSocket 路由层，定义全部 7 个端点的路由逻辑
- **关键函数/类**:
  - `authenticate_ws_token(token, db)`: 从 WebSocket URL 查询参数中提取并验证 JWT Token，返回用户信息字典
  - `_ws_lifecycle(websocket, project_id, channel, token, db)`: WebSocket 连接通用生命周期管理（认证→连接注册→消息循环→断开清理），被所有 5 个 WebSocket 端点复用
  - `ws_agent()`: `GET /ws/agent/{project_id}` — Agent 思考过程实时推送
  - `ws_stage()`: `GET /ws/stage/{project_id}` — IPD 阶段状态变更通知
  - `ws_widgets()`: `GET /ws/widgets/{project_id}` — Widget 实时更新
  - `ws_notifications()`: `GET /ws/notifications` — 系统通知推送（全局通道）
  - `ws_messages()`: `GET /ws/messages/{round_id}` — 对话消息按轮次隔离
  - `sse_messages()`: `GET /api/sse/messages/{round_id}` — SSE 降级通道，轮询数据库 messages 表获取 round_id 的新消息，每 3 秒查询一次、每 30 秒发心跳
  - `dashboard()`: `GET /api/dashboard` — Dashboard 聚合端点，返回用户信息/待办/自动完成/项目列表/通知
- **依赖关系**:
  - 引入: `asyncio`, `json`, `logging`, `time`, `fastapi`, `sqlalchemy.text`, `m0_infrastructure.database.get_db`, `m1_auth_security.security.decode_token`, `shared.errors`, `connection_manager`, `models.WSMessage`
  - 被引用: `main.py` 中 `app.include_router(router)` 注册
- **最后修改**: 2026-07-15
- **修改原因**: 实现 SSE 降级通道的消息轮询逻辑（原为 TODO 占位），轮询数据库 messages 表按 round_id 查询新消息并推送 SSE 事件

## 文件: connection_manager.py
- **路径**: `backend/m8_realtime_communication/connection_manager.py`
- **作用**: WebSocket 连接管理器单例，管理所有 WebSocket 连接的注册、注销和消息广播
- **关键函数/类**:
  - `ConnectionManager`: WebSocket 连接管理类
    - `connect(websocket, channel)`: 将 WebSocket 连接注册到指定通道
    - `disconnect(websocket)`: 移除 WebSocket 连接
    - `broadcast(channel, message)`: 向指定通道的所有连接广播消息
    - `send_to_user(user_id, message)`: 向指定用户的所有连接发送消息
  - `manager`: 全局单例实例
- **依赖关系**:
  - 引入: `asyncio`, `json`, `logging`, `fastapi.WebSocket`
  - 被引用: `router.py` 中所有 WebSocket 端点
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建

## 文件: models.py
- **路径**: `backend/m8_realtime_communication/models.py`
- **作用**: WebSocket 消息的 Pydantic 模型定义
- **关键类**:
  - `WSMessage`: WebSocket 消息模型（type, channel, data, sender, timestamp 等字段）
- **依赖关系**:
  - 引入: `pydantic`, `datetime`
  - 被引用: `router.py` 中消息接收和验证
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建

## Dashboard 响应格式（2026-07-09 更新）
`GET /api/dashboard` 返回字段已改为 **camelCase** 匹配前端：
- `pending_items` → `pending_tasks`（增加 `description`, `priority`, `projectId`, `projectName`, `waitingSince`, `createdAt` 字段）
- `auto_completed` → `recent_auto_completed`（增加 `description`, `projectId`, `projectName`, `completedAt` 字段）
- `user` → `{name, avatar, role}`（匹配前端 `DashboardUser` 类型）
- 通知 `is_read` → `read`，增加 `message`, `createdAt` 字段
- 项目列表字段名同步 camelCase

## 注意事项
- WebSocket 认证使用 URL 查询参数 `?token=xxx`（因浏览器 WebSocket API 不支持自定义请求头）
- WebSocket 关闭码 4001 是自定义码，表示认证失败
- `_ws_lifecycle` 中的消息循环是阻塞式 `while True`，每个 WebSocket 连接占用一个协程
- SSE 端点每 3 秒轮询一次数据库，按 `created_at > last_message_time` 增量查询，避免重复推送
- Dashboard 端点查询 4 张表，高并发场景建议添加缓存
