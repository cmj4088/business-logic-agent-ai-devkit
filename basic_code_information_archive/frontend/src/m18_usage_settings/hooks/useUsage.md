# m18_usage_settings/hooks/useUsage.ts — 用量数据 Hook

## 概述
管理用量数据的获取和更新，使用 `Promise.all` 并行请求用量概览、项目用量、每日趋势、用量限制和预算预警 5 个 API。提供用量限制和预算预警的更新方法。

## Hook 详细说明

### useUsage()
- **功能**: 管理用量相关数据
- **返回值**: `UsageState & { refresh, updateLimits, updateBudgetAlerts }`
- **关键逻辑**:
  - 使用 `Promise.all` 并行请求 5 个 API
  - `updateLimits`: 更新用量限制，成功后自动更新本地状态
  - `updateBudgetAlerts`: 更新预算预警，成功后自动更新本地状态
  - 初始加载和刷新都使用 `loadAll` 函数

## 依赖关系
- `react`: useState, useEffect, useCallback
- `../types`: UsageState, UsageLimits, BudgetAlerts
- `../api`: fetchUsageOverviewAPI, fetchProjectUsageAPI, fetchDailyTrendsAPI, fetchUsageLimitsAPI, updateUsageLimitsAPI, fetchBudgetAlertsAPI, updateBudgetAlertsAPI

## 注意事项
- `updateLimits` 和 `updateBudgetAlerts` 返回 boolean 表示是否成功，调用方自行处理 UI 反馈
- 错误信息从 `err.message` 提取，失败时保持已有数据不变