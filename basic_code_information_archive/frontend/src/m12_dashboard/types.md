# m12_dashboard/types.ts — Dashboard 模块类型定义

## 概述
定义 Dashboard 模块（M12）所需的类型，包括用户信息、待处理任务、自动完成事项、项目进度、通知以及 WebSocket 消息等数据结构。

## 类型定义

### DashboardUser
- **功能**: Dashboard 用户信息
- **字段**: `name` (string), `avatar?` (string), `role?` (string)

### PendingTaskPriority
- **功能**: 待处理任务优先级
- **可选值**: `'high'` | `'medium'` | `'low'`

### PendingTaskType
- **功能**: 待处理任务类型
- **可选值**: `'review'` | `'vote'` | `'gate'`

### PendingTask
- **功能**: 待处理事项
- **字段**: `id`, `title`, `description`, `priority`, `type`, `projectId`, `projectName`, `createdAt`, `waitingSince`

### AutoCompletedTask
- **功能**: Agent 自动完成事项
- **字段**: `id`, `title`, `description`, `projectId`, `projectName`, `completedAt`

### ProjectStatus
- **功能**: 项目状态
- **可选值**: `'active'` | `'completed'` | `'paused'`

### ProjectWithProgress
- **功能**: 带进度和状态的项目（扩展 Project）
- **字段**: 继承 `Project` 所有字段 + `progress` (number), `status` (ProjectStatus)

### NotificationType
- **功能**: 通知类型
- **可选值**: `'info'` | `'warning'` | `'success'` | `'error'`

### Notification
- **功能**: 系统通知
- **字段**: `id`, `title`, `message`, `type`, `createdAt`, `read`

### DashboardData
- **功能**: Dashboard 聚合响应
- **字段**: `user`, `pending_tasks`, `recent_auto_completed`, `projects`, `notifications`

### DashboardState
- **功能**: Dashboard 数据加载状态
- **字段**: `data` (DashboardData | null), `isLoading` (boolean), `error` (string | null)

### ProjectFilter
- **功能**: 项目列表筛选条件
- **可选值**: `'all'` | `'active'` | `'completed'`

### DashboardWSMessage
- **功能**: WebSocket 推送的 Dashboard 更新消息
- **字段**: `type` (消息类型), `payload` (unknown)

## 依赖关系
- 导入 `Project` from `@/shared/types`

## 注意事项
- `ProjectWithProgress` 扩展了 `Project`，增加了进度和状态字段
- `DashboardWSMessage` 的 `type` 字段有 4 种可能值：`pending_tasks_update`, `notification`, `project_update`, `dashboard_refresh`