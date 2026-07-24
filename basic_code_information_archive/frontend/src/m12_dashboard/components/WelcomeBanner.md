# m12_dashboard/components/WelcomeBanner.tsx — 欢迎横幅组件

## 概述
Dashboard 页面的欢迎横幅，展示用户名称、日期和基于时间的问候语（早上好/下午好/晚上好）。支持头像显示，无头像时显示名称首字母。

## 组件/函数详细说明

### getGreeting()
- **功能**: 根据当前时间返回问候语
- **返回值**: string
- **关键逻辑**: 12 点前返回"早上好"，18 点前返回"下午好"，其余返回"晚上好"

### formatDate()
- **功能**: 格式化日期为中文格式
- **返回值**: string（如 "2026年7月9日 星期四"）

### WelcomeBanner({ user })
- **功能**: 欢迎横幅 UI 组件
- **Props**: `user` (DashboardUser) — 用户信息
- **关键逻辑**:
  - 使用 `useMemo` 计算问候语和日期，避免每次渲染都重新计算
  - 有头像时显示圆形头像图片
  - 无头像时显示名称首字符的圆形色块
  - 有角色信息时显示角色标签
- **UI 结构**: 渐变背景（indigo -> purple），左侧文字 + 右侧头像

## 依赖关系
- `react`: useMemo
- `../types`: DashboardUser

## 注意事项
- 问候语和日期使用 `useMemo` 避免重复计算，但依赖数组为空所以只在首次渲染计算
- 头像 URL 为空时使用 fallback 显示首字母