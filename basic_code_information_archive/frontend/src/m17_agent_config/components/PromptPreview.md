# m17_agent_config/components/PromptPreview.tsx — 提示词预览组件

## 概述
渲染预览系统提示词和用户提示词模板，显示 Token 统计。调用后端 API 进行模板变量替换和渲染。

## 组件详细说明

### PromptPreview({ role, systemPrompt, projectContext, stageContext, onClose })
- **功能**: 提示词预览 UI 组件
- **Props**: 
  - `role` (AgentRole) — 角色
  - `systemPrompt` (string) — 系统提示词
  - `projectContext?` (Record<string, string>) — 项目上下文变量
  - `stageContext?` (string) — 阶段上下文
  - `onClose` (function) — 关闭回调
- **状态管理**: `preview` (渲染结果), `isLoading`, `error`
- **关键逻辑**:
  - 首次渲染显示"渲染预览"按钮
  - 点击后调用 `previewPrompt` API 获取渲染结果
  - 渲染结果显示 Token 统计 + 系统提示词 + 用户提示词模板
  - 支持重新渲染
- **UI 结构**: 白色卡片，头部（角色图标 + 名称 + 关闭按钮），渲染按钮/加载中/结果展示

## 依赖关系
- `react`: useState, useCallback
- `@/shared/types`: AgentRole
- `../types`: PromptPreviewResponse, AGENT_ROLE_META
- `../api`: previewPrompt

## 注意事项
- `systemPrompt` 为空时按钮禁用，提示"请先编辑系统提示词"
- 渲染结果使用 `<pre>` 标签保持格式，最大高度 64（`max-h-64`）