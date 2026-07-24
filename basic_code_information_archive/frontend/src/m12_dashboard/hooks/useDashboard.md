# m12_dashboard/hooks/useDashboard.ts — Dashboard 数据获取 Hook

## 概述
Dashboard 页面的核心数据 Hook，整合 HTTP API 获取和 WebSocket 实时更新。处理 loading / error / data 三态，支持手动刷新和 WebSocket 状态管理。

## Hook 详细说明

### useDashboard()
- **功能**: 获取并管理 Dashboard 数据
- **返回值**: `UseDashboardResult` — 包含 `data`, `isLoading`, `error`, `refresh`, `wsStatus`, `reconnectWS`
- **关键逻辑**:
  - 首次加载时调用 `fetchDashboardAPI` 获取数据
  - 通过 `useDashboardWS` Hook 建立 WebSocket 连接，接收实时更新
  - `handleWSMessage`: 根据消息类型局部更新数据：
    - `pending_tasks_update`: 替换待处理任务列表
    - `notification`: 将新通知插入列表头部（保留最近 20 条）
    - `project_update` / `dashboard_refresh`: 标记需要完整刷新
  - WebSocket 降级为轮询时，通过 `handleFallbackToPolling` 回调触发 HTTP 轮询（间隔 10 秒）
  - 使用 `stateRef` 避免 `fetchData` 的闭包过期问题

## 依赖关系
- `react`: useState, useEffect, useCallback, useRef
- `../api`: fetchDashboardAPI
- `./useDashboardWS`: useDashboardWS
- `../types`: DashboardState, DashboardWSMessage, PendingTask, Notification

## 注意事项
- 首次加载显示 loading 状态，后续静默刷新不显示 loading
- 已有数据时，HTTP 错误不清除已有数据（`error` 设为 null）
- 通知列表最多保留 20 条，防止内存溢出