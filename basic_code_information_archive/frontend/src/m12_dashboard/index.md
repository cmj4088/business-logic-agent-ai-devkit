# m12_dashboard/index.tsx — Dashboard 首页入口

## 概述
Dashboard 模块的首页入口组件，组合了欢迎横幅、待处理事项、自动完成事项、快速入口、项目列表和通知摘要等子组件。处理加载中、错误、无数据等边界状态。

## 组件详细说明

### DashboardPage (默认导出)
- **功能**: Dashboard 首页，使用 `useDashboard` Hook 获取数据并渲染子组件
- **关键逻辑**:
  - 加载中状态：显示居中的旋转动画
  - 错误状态（无数据）：显示错误信息和重新加载按钮
  - 无数据防御：理论上不会发生，但做了防御性处理
  - 正常状态：渲染各子组件
  - WebSocket 降级为轮询时显示黄色提示条
- **UI 结构**: 纵向布局，从上到下依次为：
  1. 欢迎横幅 (WelcomeBanner)
  2. 待处理 + 自动完成 + 快速入口（三栏网格布局）
  3. 项目列表 (ProjectList)
  4. 通知摘要 (NotificationSummary)

## 导出项

| 导出名称 | 说明 |
|----------|------|
| `DashboardPage` (default) | 首页组件 |
| `useDashboard` | 数据获取 Hook |
| 各种类型 | DashboardData, DashboardUser, PendingTask 等 |

## 依赖关系
- `./components/WelcomeBanner`: WelcomeBanner
- `./components/PendingTasks`: PendingTasks
- `./components/AutoCompletedTasks`: AutoCompletedTasks
- `./components/QuickActions`: QuickActions
- `./components/ProjectList`: ProjectList
- `./components/NotificationSummary`: NotificationSummary
- `./hooks/useDashboard`: useDashboard
- `./types`: 各种类型定义

## 注意事项
- 错误状态只在 `!data` 时显示（已有数据时静默失败）
- 最大宽度 `max-w-5xl` 限制内容宽度，适配大屏幕