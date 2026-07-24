# m15_review_dashboard/types.ts — 审核仪表盘模块类型定义

## 概述
定义审核仪表盘模块（M15）所需的全部类型，包括审核状态、优先级、投票类型、产出物类型、AI 徽章、审核项、历史记录、遗留问题等数据结构，以及大量的中文标签和颜色映射常量。

## 类型定义

### ReviewStatus
- **功能**: 审核状态
- **可选值**: `'pending'` | `'approved'` | `'rejected'` | `'needs_revision'` | `'auto_approved'` | `'escalated'`

### ReviewPriority
- **功能**: 审核优先级
- **可选值**: `'red'` | `'yellow'` | `'gray'`

### VoteType
- **功能**: 投票类型
- **可选值**: `'approve'` | `'reject'` | `'request_changes'`

### DeliverableType
- **功能**: 产出物类型（8 个门禁 + 3 个文档类型）
- **可选值**: `'CDCP'` | `'PDCP'` | `'TR3'` | `'TR4'` | `'TR5'` | `'TR6'` | `'ADCP'` | `'LDCP'` | `'MRD'` | `'SPEC'` | `'DESIGN'`

### AIBadge
- **功能**: AI 生成标识
- **字段**: `agent` (string), `agentLabel` (string), `confidence` (number), `generatedAt` (string)

### Review
- **功能**: 审核项完整信息
- **字段**: `id`, `projectId`, `projectName`, `deliverableType`, `deliverableName`, `stage`, `stageLabel`, `priority`, `status`, `industry`, `assignee`, `createdBy`, `createdAt`, `updatedAt`, `waitingHours`, `autoApproved`, `content?`, `aiBadge?`, `history?`, `issues?`

### ReviewHistoryEntry
- **功能**: 审核历史记录条目
- **字段**: `id`, `reviewId`, `action`, `reviewer`, `vote?`, `comment?`, `timestamp`

### ReviewIssue
- **功能**: 遗留问题
- **字段**: `id`, `reviewId`, `projectId`, `projectName`, `description`, `severity` ('critical'|'major'|'minor'), `status` ('open'|'resolved'|'accepted'), `createdAt`, `resolvedAt?`

### VoteRequest
- **功能**: 投票请求
- **字段**: `vote` (VoteType), `reason?` (string), `comment?` (string)

### BatchReviewRequest
- **功能**: 批量审核请求
- **字段**: `reviewIds` (string[]), `vote` (VoteType), `reason?` (string)

### ReviewFilters
- **功能**: 审核筛选参数
- **字段**: `project?`, `stage?`, `status?`, `priority?`

### ComplianceRule
- **功能**: 合规规则
- **字段**: `industry` (string), `rules` (string[])

## 常量映射

| 常量名 | 说明 |
|--------|------|
| `REVIEW_STATUS_LABELS` | 审核状态中文标签 |
| `REVIEW_STATUS_COLORS` | 审核状态颜色样式 |
| `REVIEW_PRIORITY_LABELS` | 优先级中文标签 |
| `REVIEW_PRIORITY_COLORS` | 优先级颜色样式 |
| `REVIEW_PRIORITY_ORDER` | 优先级排序权重 |
| `VOTE_TYPE_LABELS` | 投票类型中文标签 |
| `DELIVERABLE_TYPE_LABELS` | 产出物类型中文标签 |
| `STAGE_FILTERS` | 阶段筛选选项 |
| `STATUS_FILTERS` | 状态筛选选项 |

## 依赖关系
- 导入 `IPDStage`, `PaginatedResponse` from `@/shared/types`

## 注意事项
- 该文件同时定义了类型和常量，是审核模块中最大的类型文件
- `ReviewListResponse` 是对 `PaginatedResponse<Review>` 的类型别名