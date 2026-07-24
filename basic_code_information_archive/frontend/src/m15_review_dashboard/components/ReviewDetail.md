# m15_review_dashboard/components/ReviewDetail.tsx — 审核详情组件

## 概述
审核详情页面，展示单个审核的完整信息，包括基本信息、产出物内容、AI 生成标识、合规提醒、投票面板、审核升级、审核历史和遗留问题。

## 组件/函数详细说明

### AIBadgeDisplay({ agent, agentLabel, confidence })
- **功能**: AI 生成标识展示（紫色卡片，显示模型名称和置信度）
- **Props**: `agent` (string), `agentLabel` (string), `confidence` (number)

### HistoryTimeline({ history })
- **功能**: 审核历史时间线（垂直时间线，最新操作高亮）
- **Props**: `history` (ReviewHistoryEntry[])
- **关键逻辑**: 第一条历史记录用蓝色圆点高亮，后续用灰色

### IssuesList({ issues })
- **功能**: 遗留问题列表
- **Props**: `issues` (ReviewIssue[])
- **关键逻辑**: 按严重程度着色（严重红色、重要橙色、轻微黄色）

### ReviewDetail()
- **功能**: 审核详情页面组件
- **关键逻辑**:
  - 从 URL 参数获取 `reviewId`
  - 使用 `useReviewDetail` Hook 获取数据
  - `handleVote`: 提交投票
  - `handleEscalate` / `confirmEscalate`: 审核升级弹窗流程
  - `canVote`: 状态为 pending 或 escalated 时允许投票
  - 已审核且非自动通过时显示提示信息
- **UI 结构**: 
  - 返回按钮 + 审核标题卡片（基本信息网格）
  - 产出物内容（含 AI Badge）
  - 合规提醒
  - 投票面板（可投票时显示）
  - 审核升级弹窗
  - 审核历史时间线
  - 遗留问题列表

## 依赖关系
- `react`: useState
- `react-router-dom`: useNavigate, useParams
- `../types`: VoteType, 各种常量
- `../hooks/useReviews`: useReviewDetail
- `./AutoApprovedBadge`: AutoApprovedBadge
- `./ComplianceReminder`: ComplianceReminder
- `./VotePanel`: VotePanel

## 注意事项
- 审核升级弹窗使用 `fixed inset-0` 全屏遮罩
- 投票面板仅在 `canVote` 为 true 时渲染
- 审核历史仅在 `review.history` 有数据时显示