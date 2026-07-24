# m18_usage_settings/components/DailyTrendChart.tsx — 每日趋势图组件

## 概述
使用纯 CSS 实现的每日 Token 消耗堆叠柱状图，按模型分组显示不同颜色。支持 Y 轴标尺、X 轴日期标签和图例。

## 组件/函数详细说明

### MODEL_COLORS
- **功能**: 模型名称对应的颜色映射
- **值**: `{ ollama: green, claude-sonnet: blue, claude-opus: blue-dark, gpt-4o: purple, gpt-4: purple-dark, default: gray }`

### getModelColor(modelName)
- **功能**: 获取模型对应的 CSS 颜色类名
- **返回值**: string

### formatNumber(n)
- **功能**: 格式化数字（>= 1000 显示为 "XK"）
- **返回值**: string

### formatDate(dateStr)
- **功能**: 格式化日期为 "M/D" 格式
- **返回值**: string

### DailyTrendChart({ data })
- **功能**: 每日趋势柱状图 UI 组件
- **Props**: `data` (DailyTrendItem[])
- **关键逻辑**:
  - 计算 `maxTokens` 用于高度比例
  - 收集所有模型名用于图例
  - 堆叠柱状图：每个日期的柱状图由多个模型段堆叠而成
  - 高度使用 `(count / maxTokens) * 100 * 2` 的 px 值
  - 高度小于 1% 的模型段不渲染
- **UI 结构**: 标题 + 图例 + 图表区域（Y 轴 + 柱状图 + X 轴）

## 依赖关系
- `react`: React
- `../types`: DailyTrendItem

## 注意事项
- 纯 CSS 柱状图，无第三方图表库依赖
- 高度计算使用 `(heightPercent * 2)px`，使得图表高度在 0-200px 之间
- 柱状图区域可横向滚动（`overflow-x-auto`）