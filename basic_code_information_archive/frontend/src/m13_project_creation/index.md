# m13_project_creation/index.tsx — 项目创建入口页面

## 概述
项目创建模块的入口页面，提供页面标题和说明，渲染 QuickStartForm 快速创建表单。

## 组件详细说明

### ProjectCreationPage (默认导出)
- **功能**: 项目创建页面
- **UI 结构**: 居中布局（max-w-2xl），标题"创建新项目"，副标题说明，QuickStartForm 表单
- **导出**: 同时导出 `useProjectCreation` Hook

## 依赖关系
- `./components/QuickStartForm`: QuickStartForm
- `./hooks/useProjectCreation`: useProjectCreation

## 注意事项
- 页面背景为 `bg-slate-50`，表单最大宽度 2xl