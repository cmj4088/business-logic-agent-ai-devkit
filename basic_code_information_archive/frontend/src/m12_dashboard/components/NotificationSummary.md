# m12_dashboard/components/NotificationSummary.tsx — 通知摘要组件

## 概述
展示最近的系统通知（最多 20 条），支持按通知类型着色（info 蓝色、warning 黄色、success 绿色、error 红色）。显示未读通知数量和相对时间。

## 组件/函数详细说明

### NOTIFICATION_STYLES
- **功能**: 通知类型对应的样式（图标颜色、背景色、圆点颜色）

### formatNotificationTime(dateStr)
- **功能**: 格式化通知时间为相对时间（与 AutoCompletedTasks 相同的逻辑）
- **参数**: `dateStr` (string)
- **返回值**: string

### NotificationSummary({ notifications })
- **功能**: 通知摘要 UI 组件
- **Props**: `notifications` (Notification[])
- **关键逻辑**:
  - 使用 `useMemo` 截取前 20 条通知
  - 计算未读通知数量，显示红色徽章
  - 未读通知有浅色背景高亮，已读通知正常显示
  - 空列表时显示"暂无通知"
- **UI 结构**: 白色卡片，头部显示标题和未读徽章，列表按类型着色

## 依赖关系
- `react`: useMemo
- `../types`: Notification, NotificationType

## 注意事项
- 截取前 20 条与 `useDashboard` Hook 中保持一致
- 通知消息使用 `line-clamp-2` 限制最多显示 2 行