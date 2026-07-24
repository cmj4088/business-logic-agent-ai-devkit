# m14a_project_skeleton/components/SidebarPanel/BudgetWidget.tsx — 预算健康度小组件（骨架）

## 概述
预算健康度小组件的骨架容器，展示预算偏差百分比和预算使用进度条。当前为静态占位，后续版本将接入真实数据。

## 组件详细说明

### BudgetWidget({ projectId })
- **功能**: 预算健康度小组件
- **Props**: `projectId` (string) — 项目 ID（当前未使用，标记为 `_projectId`）
- **关键逻辑**: 当前显示静态数据（偏差 5%，使用率 35%）
- **UI 结构**: 白色卡片，标题"预算健康度"，偏差指示器，进度条，状态说明

## 依赖关系
- `react`: FC

## 注意事项
- 骨架组件，`projectId` 参数预留但未使用
- 后续版本需要接入真实项目预算数据