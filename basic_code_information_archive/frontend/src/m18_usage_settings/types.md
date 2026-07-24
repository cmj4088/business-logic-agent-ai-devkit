# m18_usage_settings/types.ts — 用量与设置模块类型定义

## 概述
定义用量与设置模块（M18）所需的类型，包括用量概览、模型用量、项目用量、每日趋势、用量限制、预算预警、全局设置、通知偏好等数据结构。

## 类型定义

### UsageOverview
- **功能**: 用量概览数据
- **字段**: `total_tokens`, `total_cost`, `total_calls`, `active_projects`, `model_distribution` (ModelUsage[])

### ModelUsage
- **功能**: 单个模型的用量统计
- **字段**: `model_name`, `model_label`, `token_count`, `cost`, `percentage`, `is_local`

### ProjectUsageItem
- **功能**: 项目用量明细
- **字段**: `project_id`, `project_name`, `total_tokens`, `total_cost`, `call_count`, `model_breakdown`

### DailyTrendItem
- **功能**: 每日趋势数据点
- **字段**: `date`, `total_tokens`, `model_breakdown` (Record<string, number>)

### UsageLimits
- **功能**: 用量限制配置
- **字段**: `daily_limit`, `daily_enabled`, `monthly_limit`, `monthly_enabled`

### BudgetAlerts
- **功能**: 预算预警配置
- **字段**: `threshold_percent`, `enabled`

### GlobalSettings
- **功能**: 全局设置
- **字段**: `language` ('zh-CN' | 'en'), `theme` ('light' | 'dark' | 'system'), `notifications` (NotificationPreferences)

### NotificationPreferences
- **功能**: 通知偏好
- **字段**: `gate_ready` (boolean), `stage_complete` (boolean), `budget_warning` (boolean)

### UsageState / SettingsState
- **功能**: 用量/设置数据加载状态
- **字段**: 数据 + `isLoading`, `error`, 设置状态还包括 `isSaving`

### ExportRequest / ClearDataRequest
- **功能**: 导出/清除数据请求体

## 依赖关系
- 无外部依赖，纯类型定义

## 注意事项
- `ModelUsage.is_local` 标识是否为本地模型（如 Ollama），本地模型通常无成本
- `DailyTrendItem.model_breakdown` 使用 `Record<string, number>` 动态键名