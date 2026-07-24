# m18_usage_settings/components/UsageOverview.tsx — 用量概览组件

## 概述
用量概览统计面板，展示总 Token 消耗、总成本、调用次数和活跃项目数 4 个概览卡片，以及按模型分布的用量柱状图。

## 组件/函数详细说明

### formatNumber(n)
- **功能**: 格式化数字（千分位分隔）
- **参数**: `n` (number)
- **返回值**: string

### formatCost(n)
- **功能**: 格式化金额（美元）
- **参数**: `n` (number)
- **返回值**: string（如 "$12.50"）

### StatCard({ label, value, icon })
- **功能**: 概览统计卡片
- **Props**: `label` (string), `value` (string), `icon` (string emoji)
- **UI**: 白色卡片，emoji + 标签 + 大号数值

### ModelDistributionBar({ models })
- **功能**: 模型分布柱状图
- **Props**: `models` (ModelUsage[])
- **关键逻辑**: 
  - 每个模型一行，显示名称、百分比、成本
  - 本地模型标注"(本地)"标签
  - 进度条宽度对应百分比

### UsageOverview({ data })
- **功能**: 用量概览主组件
- **Props**: `data` (UsageOverview)
- **UI 结构**: 标题 + 4 列概览卡片 + 模型分布图

## 依赖关系
- `react`: React
- `../types`: UsageOverview, ModelUsage

## 注意事项
- 使用 emoji 作为卡片图标，简单直观
- 成本格式化为 2 位小数美元金额