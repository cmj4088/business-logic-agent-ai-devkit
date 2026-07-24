# m12_dashboard/components/ProjectList.tsx — 项目列表组件

## 概述
展示用户的所有项目（含状态、进度、当前阶段），支持按状态筛选（全部/进行中/已完成）。提供创建新项目的快捷入口。

## 组件/函数详细说明

### STAGE_LABELS
- **功能**: IPD 阶段中文标签映射
- **值**: `{ concept: '概念阶段', plan: '计划阶段', ... }`

### STATUS_CONFIG
- **功能**: 项目状态 UI 配置（标签、圆点颜色、文字颜色）
- **值**: `{ active, completed, paused }`

### getProgressColor(progress)
- **功能**: 根据进度百分比返回进度条颜色
- **参数**: `progress` (number)
- **返回值**: string (CSS 类名)
- **关键逻辑**: >= 100 灰色，>= 60 绿色，>= 30 黄色，其他蓝色

### FILTER_OPTIONS
- **功能**: 筛选选项列表
- **值**: `[{ all, active, completed }]`

### ProjectList({ projects })
- **功能**: 项目列表 UI 组件
- **Props**: `projects` (ProjectWithProgress[])
- **状态管理**: `filter` (ProjectFilter) — 当前筛选条件
- **关键逻辑**:
  - 使用 `useMemo` 按 `filter` 状态筛选项目
  - 空列表时显示空状态引导（引导创建项目或提示无符合条件项目）
  - 点击项目行跳转到项目详情页
  - 每个项目显示状态圆点、名称、状态标签、当前阶段、创建日期、进度条
  - 头部有筛选按钮组和创建新项目按钮
- **UI 结构**: 白色卡片，含筛选按钮组、创建按钮、项目列表（或空状态引导）

## 依赖关系
- `react`: useState, useMemo
- `react-router-dom`: useNavigate
- `../types`: ProjectWithProgress, ProjectFilter, ProjectStatus
- `@/shared/types`: IPDStage

## 注意事项
- 进度条使用 `Math.min(project.progress, 100)` 确保不超过 100%
- 创建日期格式化为"X月X日"