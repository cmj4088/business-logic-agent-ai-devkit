# m12_dashboard/components/PendingTasks.tsx — 待处理事项组件

## 概述
展示需要用户操作的审核/投票/门禁事项，按优先级排序（红色 > 黄色 > 灰色）。每个事项显示类型标签、项目名称、描述和等待时长。

## 组件/函数详细说明

### PRIORITY_ORDER
- **功能**: 优先级排序权重映射
- **值**: `{ high: 0, medium: 1, low: 2 }`

### PRIORITY_STYLES
- **功能**: 优先级对应的颜色样式（dot 颜色、border 颜色、背景色、文字色）

### TYPE_LABELS
- **功能**: 任务类型中文标签
- **值**: `{ review: '审核', vote: '投票', gate: '门禁' }`

### PendingTasks({ tasks })
- **功能**: 待处理事项列表 UI 组件
- **Props**: `tasks` (PendingTask[])
- **关键逻辑**:
  - 使用 `useMemo` 按优先级排序（high 优先）
  - 空列表时返回 `null`（不渲染任何内容）
  - 每个事项显示优先级圆点、标题、类型标签、项目名称、描述、等待时长
- **UI 结构**: 白色卡片，标题"需要你处理"，列表项按优先级着色

## 依赖关系
- `react`: useMemo
- `../types`: PendingTask

## 注意事项
- 空列表时返回 `null`，由父组件控制布局
- 等待时长 `waitingSince` 直接显示后端返回的描述文本