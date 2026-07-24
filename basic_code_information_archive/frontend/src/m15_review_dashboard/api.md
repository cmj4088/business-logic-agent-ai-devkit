# m15_review_dashboard/api.ts — 审核仪表盘 API 调用层

## 概述
审核仪表盘模块的 API 调用封装，包含审核列表、详情、投票、批量审核、审核历史、遗留问题和审核升级等 7 个 API 函数。

## 函数详细说明

### fetchReviewsAPI(filters?)
- **功能**: 获取审核列表（支持筛选）
- **参数**: `filters` (ReviewFilters) — 可选筛选条件
- **返回值**: `Promise<ReviewListResponse>`
- **API 端点**: `GET /api/reviews?project=&stage=&status=&priority=`
- **关键逻辑**: 将 filters 对象转为 URL 查询参数，'all' 值不添加

### fetchReviewDetailAPI(reviewId)
- **功能**: 获取审核详情
- **返回值**: `Promise<Review>`
- **API 端点**: `GET /api/reviews/{reviewId}`

### submitVoteAPI(reviewId, data)
- **功能**: 提交投票
- **返回值**: `Promise<Review>`（返回更新后的审核）
- **API 端点**: `POST /api/reviews/{reviewId}/vote`

### batchReviewAPI(data)
- **功能**: 批量审核
- **返回值**: `Promise<Review[]>`
- **API 端点**: `POST /api/reviews/batch`

### fetchReviewHistoryAPI()
- **功能**: 获取审核历史
- **返回值**: `Promise<Review[]>`
- **API 端点**: `GET /api/reviews/history`

### fetchReviewIssuesAPI()
- **功能**: 获取遗留问题
- **返回值**: `Promise<ReviewIssue[]>`
- **API 端点**: `GET /api/reviews/issues`

### escalateReviewAPI(reviewId, reason)
- **功能**: 审核升级
- **返回值**: `Promise<Review>`
- **API 端点**: `POST /api/reviews/{reviewId}/escalate`

## 依赖关系
- 导入 `get`, `post` from `@/shared/api-client`
- 导入 Review, ReviewListResponse, ReviewIssue, VoteRequest, BatchReviewRequest, ReviewFilters from `./types`

## 注意事项
- `fetchReviewsAPI` 的筛选参数 'all' 表示不过滤，不会添加到查询字符串
- `submitVoteAPI` 返回更新后的 Review 对象，可直接更新本地状态