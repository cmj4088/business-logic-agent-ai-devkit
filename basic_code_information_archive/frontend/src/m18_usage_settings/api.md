# m18_usage_settings/api.ts — 用量与设置模块 API 调用层

## 概述
用量与设置模块的 API 调用封装，包含用量概览、项目用量、每日趋势、用量限制、预算预警、全局设置、数据导出和清除等功能。

## 函数详细说明

### fetchUsageOverviewAPI()
- **功能**: 获取用量概览
- **返回值**: `Promise<UsageOverview>`
- **API 端点**: `GET /api/usage/overview`

### fetchProjectUsageAPI()
- **功能**: 获取项目用量明细
- **返回值**: `Promise<ProjectUsageItem[]>`
- **API 端点**: `GET /api/usage/projects`

### fetchDailyTrendsAPI()
- **功能**: 获取每日趋势
- **返回值**: `Promise<DailyTrendItem[]>`
- **API 端点**: `GET /api/usage/daily-trends`

### fetchUsageLimitsAPI()
- **功能**: 获取用量限制
- **返回值**: `Promise<UsageLimits>`
- **API 端点**: `GET /api/usage/limits`

### updateUsageLimitsAPI(data)
- **功能**: 更新用量限制
- **返回值**: `Promise<UsageLimits>`
- **API 端点**: `PUT /api/usage/limits`

### fetchBudgetAlertsAPI()
- **功能**: 获取预算预警
- **返回值**: `Promise<BudgetAlerts>`
- **API 端点**: `GET /api/usage/budget-alerts`

### updateBudgetAlertsAPI(data)
- **功能**: 更新预算预警
- **返回值**: `Promise<BudgetAlerts>`
- **API 端点**: `PUT /api/usage/budget-alerts`

### fetchSettingsAPI()
- **功能**: 获取全局设置
- **返回值**: `Promise<GlobalSettings>`
- **API 端点**: `GET /api/settings`

### updateSettingsAPI(data)
- **功能**: 更新全局设置
- **返回值**: `Promise<GlobalSettings>`
- **API 端点**: `PUT /api/settings`

### exportDataAPI()
- **功能**: 导出数据（返回 Blob）
- **返回值**: `Promise<Blob>`
- **API 端点**: `POST /api/data/export`

### clearDataAPI(confirmation)
- **功能**: 清除所有数据
- **返回值**: `Promise<{ success: boolean }>`
- **API 端点**: `POST /api/data/clear`

## 依赖关系
- 导入 `get`, `post`, `put` from `@/shared/api-client`
- 导入各种类型 from `./types`

## 注意事项
- `exportDataAPI` 返回 Blob 对象，前端需要创建下载链接
- `clearDataAPI` 需要传入确认字符串（如 "DELETE"）