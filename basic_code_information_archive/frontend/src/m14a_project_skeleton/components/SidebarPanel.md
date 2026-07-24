# m14a_project_skeleton/components/SidebarPanel.tsx — 侧边栏面板容器

## 概述
右侧侧边栏面板容器，组合了预算健康度、供应链状态、认证进度和竞品动态四个小组件。

## 组件详细说明

### SidebarPanel({ projectId })
- **功能**: 侧边栏面板容器 UI 组件
- **Props**: `projectId` (string)
- **关键逻辑**: 将 `projectId` 传递给每个子组件
- **UI 结构**: 垂直排列的 4 个小组件，间距 `gap-4`

## 依赖关系
- `react`: FC
- `./SidebarPanel/BudgetWidget`: BudgetWidget
- `./SidebarPanel/SupplyChainWidget`: SupplyChainWidget
- `./SidebarPanel/CertificationWidget`: CertificationWidget
- `./SidebarPanel/CompetitorWidget`: CompetitorWidget

## 注意事项
- 所有子组件接收 `projectId` 但当前 MVP 阶段均为骨架占位，未使用该参数
- 子组件名前加 `_` 前缀（如 `_projectId`）表示参数预留但未使用