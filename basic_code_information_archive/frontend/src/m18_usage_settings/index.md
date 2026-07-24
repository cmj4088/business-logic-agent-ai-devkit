# m18_usage_settings/index.tsx — 设置模块入口页面

## 概述
用量与设置模块的入口页面，采用左侧导航 + 右侧内容区的布局。包含 3 个子路由：用量统计（usage）、全局设置（general）、关于（about）。默认重定向到用量统计。

## 组件/函数详细说明

### NavItem({ to, label })
- **功能**: 侧边导航链接组件
- **Props**: `to` (string), `label` (string)
- **关键逻辑**: 使用 `NavLink` 实现激活状态高亮（蓝色背景 + 蓝色文字）

### UsagePage()
- **功能**: 用量统计页面（内联组件）
- **关键逻辑**: 使用 `useUsage` Hook，组合 UsageOverview、DailyTrendChart、ProjectUsage、UsageLimitsComponent、BudgetAlertsComponent

### GeneralPage()
- **功能**: 全局设置页面（内联组件）
- **关键逻辑**: 使用 `useSettings` Hook，组合 GeneralSettings 和 DataManagement

### SettingsPage (默认导出)
- **功能**: 设置模块入口页面
- **关键逻辑**: 
  - 左侧 48 宽度导航栏，3 个导航项
  - 右侧内容区使用嵌套 `<Routes>` 渲染子路由
  - 默认路由 `*` 重定向到 `usage`
- **UI 结构**: 左侧导航 + 右侧内容区

## 导出项

| 导出名称 | 说明 |
|----------|------|
| `SettingsPage` (default) | 设置入口页面 |
| `useUsage` | 用量数据 Hook |
| `useSettings` | 设置数据 Hook |

## 依赖关系
- `react-router-dom`: Routes, Route, Navigate, NavLink
- `./components/*`: 8 个子组件
- `./hooks/useUsage`: useUsage
- `./hooks/useSettings`: useSettings

## 注意事项
- 子路由在 `SettingsPage` 内部定义，父路由在 `App.tsx` 中为 `/settings/*`
- `UsagePage` 和 `GeneralPage` 为内联组件，未拆分为独立文件