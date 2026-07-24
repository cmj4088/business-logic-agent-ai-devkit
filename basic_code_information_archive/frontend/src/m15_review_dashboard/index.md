# m15_review_dashboard/index.tsx — 审核仪表盘入口页面

## 概述
审核仪表盘模块的入口页面，使用标签页切换展示审核清单、批量审核、审核历史和遗留问题四个视图。组合了所有子组件和 Hooks。

## 组件详细说明

### ReviewDashboardPage (默认导出)
- **功能**: 审核仪表盘主页面
- **关键逻辑**:
  - 4 个标签页：审核清单（reviews）、批量审核（batch）、审核历史（history）、遗留问题（issues）
  - 每个标签页显示对应数据的数量
  - 审核清单：使用 `ReviewList` 组件 + `useReviews` Hook
  - 批量审核：使用 `BatchReview` 组件 + `useBatchReview` Hook
  - 审核历史：使用 `ReviewHistory` 组件 + `useReviewHistory` Hook
  - 遗留问题：内联渲染，使用 `useReviewIssues` Hook
  - 点击审核项跳转到 `/reviews/:reviewId`
- **UI 结构**: 页面标题 + 标签页切换 + 对应内容区

## 导出项

| 导出名称 | 说明 |
|----------|------|
| `ReviewDashboardPage` (default) | 审核仪表盘页面 |
| `ReviewDetail` | 审核详情组件 |
| `useReviews`, `useReviewDetail`, `useBatchReview`, `useReviewHistory`, `useReviewIssues` | 审核相关 Hooks |

## 依赖关系
- `react`: useState
- `react-router-dom`: useNavigate
- `./hooks/useReviews`: useReviews, useBatchReview, useReviewHistory, useReviewIssues
- `./components/ReviewList`: ReviewList
- `./components/BatchReview`: BatchReview
- `./components/ReviewHistory`: ReviewHistory
- `./components/ReviewDetail`: ReviewDetail
- `./types`: VoteType

## 注意事项
- 遗留问题视图直接在 `index.tsx` 中渲染，未拆分为独立组件
- 标签页使用 `button` 实现，非 `NavLink`（不走路由切换）