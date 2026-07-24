# m12_dashboard/components/AutoCompletedTasks.tsx — 自动完成事项组件

## 概述
展示 Agent 最近自动完成的工作事项。每个事项显示项目名称、描述和相对时间（如"刚刚"、"3分钟前"、"2小时前"）。

## 组件/函数详细说明

### formatRelativeTime(dateStr)
- **功能**: 将时间字符串格式化为相对时间
- **参数**: `dateStr` (string)
- **返回值**: string
- **关键逻辑**:
  - 小于 1 分钟：显示"刚刚"
  - 小于 60 分钟：显示"X分钟前"
  - 小于 24 小时：显示"X小时前"
  - 小于 7 天：显示"X天前"
  - 其他：显示"X月X日"

### AutoCompletedTasks({ tasks })
- **功能**: 自动完成事项列表 UI 组件
- **Props**: `tasks` (AutoCompletedTask[])
- **关键逻辑**: 空列表时返回 `null`
- **UI 结构**: 白色卡片，标题"自动完成"，列表项带绿色对勾标识

## 依赖关系
- `../types`: AutoCompletedTask

## 注意事项
- 空列表时返回 `null`，由父组件控制布局
- 时间格式化纯客户端计算，不需要引入 moment/dayjs 等库