# m12_dashboard/hooks/useDashboardWS.ts — Dashboard WebSocket 连接 Hook

## 概述
管理 Dashboard 页面的 WebSocket 连接，接收实时状态更新。支持自动重连（最多 3 次）和降级为轮询模式。提供连接状态监控和手动重连功能。

## 类型/函数详细说明

### WSConnectionStatus
- **功能**: WebSocket 连接状态
- **可选值**: `'connecting'` | `'connected'` | `'disconnected'` | `'fallback'`

### UseDashboardWSOptions (接口)
- **功能**: Hook 的配置选项
- **字段**: `onMessage`, `onFallbackToPolling`, `pollIntervalMs?` (默认 10000)

### UseDashboardWSResult (接口)
- **功能**: Hook 的返回值
- **字段**: `status` (WSConnectionStatus), `reconnect` (手动重连方法)

### buildWsUrl()
- **功能**: 构建 WebSocket URL，根据当前协议自动选择 `ws:` 或 `wss:`
- **返回值**: string

### isDashboardMessage(data)
- **功能**: 类型守卫，判断收到的数据是否为有效的 Dashboard WS 消息
- **参数**: `data` (unknown)
- **返回值**: `data is DashboardWSMessage`

### useDashboardWS(options)
- **功能**: 管理 Dashboard WebSocket 连接
- **参数**: `{ onMessage, onFallbackToPolling, pollIntervalMs }`
- **返回值**: `{ status, reconnect }`
- **关键逻辑**:
  - `connect`: 建立 WebSocket 连接，设置 onopen/onmessage/onerror/onclose 回调
  - 连接关闭时自动延迟 2 秒重连，最多重连 3 次
  - 超过重连次数后降级为轮询模式（`fallbackToPolling`）
  - 轮询模式通过 `setInterval` 定时调用 `onFallbackToPolling` 回调
  - `reconnect`: 重置重连计数器，清理轮询，重新连接
  - 组件卸载时清理 WebSocket 和轮询定时器

## 依赖关系
- `react`: useEffect, useRef, useCallback, useState
- `../types`: DashboardWSMessage

## 注意事项
- 使用 `isMountedRef` 防止组件卸载后的状态更新
- 解析 WebSocket 消息失败时静默忽略，不抛出错误
- WebSocket 错误通过 `onclose` 统一处理，`onerror` 为空回调