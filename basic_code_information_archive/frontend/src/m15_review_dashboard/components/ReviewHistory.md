# m15_review_dashboard/components/ReviewHistory.tsx — 审核历史组件

## 概述
展示审核历史记录列表，每条记录显示审核类型、项目名称、阶段、更新日期、自动通过标识和状态标签。

## 组件详细说明

### ReviewHistory({ history, loading, error, onRefresh, onViewDetail })
- **功能**: 审核历史列表 UI 组件
- **Props**:
  - `history` (Review[]) — 历史审核列表
  - `loading` (boolean) — 加载状态
  - `error` (string | null) — 错误信息
  - `onRefresh` — 刷新回调
  - `onViewDetail` — 查看详情回调
- **关键逻辑**:
  - 空列表显示"暂无审核历史记录"
  - 自动通过的审核额外显示"自动通过"文字
- **UI 结构**: 白色卡片，头部刷新按钮 + 历史列表

## 依赖关系
- `../types`: Review, REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS, DELIVERABLE_TYPE_LABELS

## 注意事项
- 与 `ReviewList` 类似但更简洁，无筛选和操作按钮
- 每条记录显示"查看详情"链接