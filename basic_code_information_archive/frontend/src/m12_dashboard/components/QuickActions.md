# m12_dashboard/components/QuickActions.tsx — 快速入口组件

## 概述
提供创建新项目和查看审核仪表盘的快捷入口，采用图标卡片形式展示。

## 组件/函数详细说明

### QuickAction (接口)
- **功能**: 快速入口数据项
- **字段**: `label`, `description`, `path`, `icon` (ReactNode)

### CreateProjectIcon / ReviewIcon
- **功能**: 内联 SVG 图标组件

### ACTIONS
- **功能**: 快速入口列表
- **值**: 创建新项目（跳转 `/projects/new`）和审核仪表盘（跳转 `/review`）

### QuickActions()
- **功能**: 快速入口 UI 组件
- **关键逻辑**: 使用 `useNavigate` 进行路由跳转
- **UI 结构**: 2 列网格布局，每个入口包含图标、标题和描述

## 依赖关系
- `react-router-dom`: useNavigate

## 注意事项
- 图标使用内联 SVG，无需额外图标库
- 审核仪表盘路径为 `/review`，与路由配置一致