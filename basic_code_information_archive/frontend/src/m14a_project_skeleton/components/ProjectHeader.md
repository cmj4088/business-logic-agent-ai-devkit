# m14a_project_skeleton/components/ProjectHeader.tsx — 项目头部组件

## 概述
项目详情页的顶部标题栏，展示项目名称、复杂度级别、状态标签、当前阶段、进度条和操作按钮（暂停、推进到下一阶段、更多操作）。

## 组件详细说明

### ProjectHeader({ project })
- **功能**: 项目头部 UI 组件
- **Props**: `project` (ProjectDetail)
- **关键逻辑**:
  - 根据 `project.status` 映射状态颜色（active: 绿色, paused: 琥珀色, completed: 蓝色, archived: 灰色）
  - 根据 `project.complexity` 显示中文标签（标准模式/轻量模式/完整模式/自动模式）
  - 进度条百分比限制在 0-100%
  - 左侧：项目名称 + 复杂度标签 + 状态标签 + 当前阶段
  - 右侧：进度条 + 暂停/推进/更多操作按钮
- **UI 结构**: 白色背景，底部边框，水平布局

## 依赖关系
- `react`: FC
- `../types`: ProjectDetail, STAGE_LABELS, PROJECT_STATUS_LABELS

## 注意事项
- 操作按钮（暂停、推进）为骨架占位，M14b 联调时实现功能
- 复杂度标签使用三元运算符嵌套，可读性一般