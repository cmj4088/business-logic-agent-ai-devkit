# m15_review_dashboard/components/BatchReview.tsx — 批量审核组件

## 概述
批量审核组件，支持选择多个待审核项进行批量通过/驳回/需要修改操作。包含全选、确认弹窗等功能。

## 组件详细说明

### BatchReview({ reviews, selectedIds, processing, error, onToggleSelect, onSelectAll, onClearSelection, onSubmitBatch })
- **功能**: 批量审核 UI 组件
- **Props**: 
  - `reviews` (Review[]) — 所有审核项
  - `selectedIds` (Set<string>) — 已选择 ID 集合
  - `processing` (boolean) — 处理中状态
  - `error` (string | null) — 错误信息
  - `onToggleSelect` — 切换选择回调
  - `onSelectAll` — 全选回调
  - `onClearSelection` — 清空选择回调
  - `onSubmitBatch` — 批量提交回调
- **状态管理**: `batchVote`, `reason`, `showConfirm`
- **关键逻辑**:
  - `batchableReviews`: 仅筛选状态为 `pending` 的审核项
  - 全选复选框：已全选时点击取消全选
  - 驳回和需要修改需要填写理由
  - 确认弹窗显示操作数量和类型
  - 提交按钮显示选中的数量和操作类型
- **UI 结构**: 白色卡片，全选复选框 + 审核项列表 + 批量操作按钮 + 理由输入 + 确认弹窗 + 提交按钮

## 依赖关系
- `react`: useState
- `../types`: VoteType, Review, VOTE_TYPE_LABELS

## 注意事项
- 仅 `status === 'pending'` 的审核项可批量操作
- 审核项列表最大高度 48（`max-h-48`），超出滚动
- 提交后父组件需要调用 `refresh` 刷新列表