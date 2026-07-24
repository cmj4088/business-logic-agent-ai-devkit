# m15_review_dashboard/components/ReviewList.tsx — 审核清单组件

## 概述
审核清单列表组件，展示待审核/已审核事项，支持按阶段和状态筛选。每个审核项显示优先级、类型、项目名称、阶段、等待时间和自动通过标识。

## 组件/函数详细说明

### PriorityIndicator({ priority })
- **功能**: 优先级指示器（彩色圆点 + 文字标签）
- **Props**: `priority` (Review['priority'])
- **UI**: 红色圆点"高优先级"、黄色"中优先级"、灰色"低优先级"

### WaitingTime({ hours })
- **功能**: 等待时间显示
- **Props**: `hours` (number)
- **关键逻辑**: < 1 小时"刚刚提交"，< 24 小时橙色"已等待 X 小时"，>= 24 小时红色"已等待 X 天"

### ReviewList({ reviews, loading, error, filters, onFilterChange, onRefresh, onViewDetail })
- **功能**: 审核清单列表 UI 组件
- **Props**: 
  - `reviews` (Review[]) — 审核列表
  - `loading` (boolean) — 加载状态
  - `error` (string | null) — 错误信息
  - `filters` (ReviewFilters) — 筛选条件
  - `onFilterChange` — 筛选变更回调
  - `onRefresh` — 刷新回调
  - `onViewDetail` — 查看详情回调
- **关键逻辑**:
  - 筛选栏包含阶段和状态下拉框
  - 待审核/已升级状态的审核显示"去审核"按钮，其他显示"查看详情"
  - 自动通过的审核显示 `AutoApprovedBadge` 标识
- **UI 结构**: 白色卡片，筛选栏 + 审核列表

## 依赖关系
- `../types`: Review, ReviewFilters, ReviewStatus, 各种常量
- `./AutoApprovedBadge`: AutoApprovedBadge

## 注意事项
- 筛选下拉框使用 `STAGE_FILTERS` 和 `STATUS_FILTERS` 常量
- 状态为 `pending` 或 `escalated` 时显示操作按钮，否则只显示详情链接