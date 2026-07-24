# m15_review_dashboard/hooks/useReviews.ts — 审核数据 Hooks

## 概述
审核仪表盘模块的核心数据 Hooks 集合，包含 5 个 Hook：`useReviews`（审核列表）、`useReviewDetail`（审核详情）、`useBatchReview`（批量审核）、`useReviewHistory`（审核历史）、`useReviewIssues`（遗留问题）。

## Hook 详细说明

### useReviews()
- **功能**: 管理审核列表，支持筛选和排序
- **返回值**: `{ reviews, allReviews, loading, error, filters, updateFilter, refresh }`
- **关键逻辑**: 
  - 加载后按优先级排序（red > yellow > gray）
  - `updateFilter` 使用泛型确保类型安全
  - `filteredReviews` 在前端做二次筛选

### useReviewDetail(reviewId)
- **功能**: 管理审核详情，支持投票和升级
- **参数**: `reviewId` (string | undefined)
- **返回值**: `{ review, loading, error, voting, voteError, submitVote, escalate, refresh }`
- **关键逻辑**: 
  - `submitVote` 提交后自动更新本地 review 状态
  - `escalate` 提交升级原因后更新状态

### useBatchReview()
- **功能**: 管理批量审核选择状态
- **返回值**: `{ selectedIds, processing, error, toggleSelect, selectAll, clearSelection, submitBatch }`
- **关键逻辑**:
  - `selectedIds` 使用 `Set<string>` 管理，确保唯一性
  - `toggleSelect` 最多选择 2 个版本对比时替换旧选择
  - 提交后自动清空选择

### useReviewHistory()
- **功能**: 管理审核历史数据
- **返回值**: `{ history, loading, error, refresh }`

### useReviewIssues()
- **功能**: 管理遗留问题，支持严重程度和状态筛选
- **返回值**: `{ issues, allIssues, loading, error, severityFilter, statusFilter, setSeverityFilter, setStatusFilter, refresh }`
- **关键逻辑**: 前端筛选严重程度（critical/major/minor）和状态（open/resolved/accepted）

## 依赖关系
- `react`: useState, useCallback, useEffect, useMemo
- `../types`: 各种类型定义
- `../api`: fetchReviewsAPI, fetchReviewDetailAPI, submitVoteAPI, batchReviewAPI, fetchReviewHistoryAPI, fetchReviewIssuesAPI, escalateReviewAPI

## 注意事项
- 所有 Hook 都遵循 loading / error / data 三态管理
- `useBatchReview` 提交后自动清空选择，父组件需要调用 `refresh` 刷新列表