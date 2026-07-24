# m14a_project_skeleton/hooks/useProjectWS.ts — 项目 WebSocket 连接 Hook

## 概述
管理项目详情页的 WebSocket 连接，用于接收项目实时更新。提供 `send` 发送消息和 `close` 关闭连接的方法。

## Hook 详细说明

### useProjectWS(projectId, onMessage)
- **功能**: 建立和管理项目 WebSocket 连接
- **参数**: 
  - `projectId` (string) — 项目 ID
  - `onMessage` (WSMessageHandler) — 收到消息时的回调
- **返回值**: `{ send, close }`
- **关键逻辑**:
  - WebSocket URL 格式：`ws://localhost:8000/ws/project/{projectId}`
  - `send`: 发送 JSON 序列化消息（仅在 OPEN 状态下发送）
  - `close`: 关闭 WebSocket 连接
  - 组件卸载时自动关闭连接
  - 消息解析失败时打印警告不中断

## 依赖关系
- `react`: useEffect, useRef, useCallback

## 注意事项
- WebSocket URL 硬编码为 `localhost:8000`，生产环境需要改为动态获取
- 当前在 `index.tsx` 中使用，收到消息后直接调用 `refresh()` 刷新全部数据
- `onMessage` 变化时会重新建立连接（在 useEffect 依赖中）