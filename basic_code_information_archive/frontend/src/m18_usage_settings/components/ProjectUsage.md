# m18_usage_settings/components/ProjectUsage.tsx — 项目用量明细组件

## 概述
以表格形式展示各项目的用量明细，包括项目名称、Token 消耗、调用次数和成本。

## 组件详细说明

### ProjectUsage({ projects })
- **功能**: 项目用量明细表格 UI 组件
- **Props**: `projects` (ProjectUsageItem[])
- **关键逻辑**: 空列表显示"暂无项目用量数据"
- **UI 结构**: 标题 + 表格（项目名称、Token 消耗、调用次数、成本 4 列）

## 依赖关系
- `react`: React
- `../types`: ProjectUsageItem

## 注意事项
- 数值使用 `formatNumber` 和 `formatCost` 格式化
- 表格使用 `hover:bg-slate-50` 行悬停效果