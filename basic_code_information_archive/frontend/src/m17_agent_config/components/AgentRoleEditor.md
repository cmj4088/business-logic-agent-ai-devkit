# m17_agent_config/components/AgentRoleEditor.tsx — Agent 角色编辑器组件

## 概述
编辑 Agent 角色的系统提示词，提供 textarea 编辑区、字符计数、保存/重置/预览渲染操作按钮。

## 组件详细说明

### AgentRoleEditor({ role, template, isLoading, isSaving, onSave, onPreview, onClose })
- **功能**: Agent 角色提示词编辑器 UI 组件
- **Props**: 
  - `role` (AgentRole) — 角色类型
  - `template` (PromptTemplate | null) — 提示词模板
  - `isLoading` (boolean) — 模板加载中
  - `isSaving` (boolean) — 保存中
  - `onSave` (function) — 保存回调
  - `onPreview` (function) — 预览回调
  - `onClose` (function) — 关闭回调
- **状态管理**: `systemPrompt` (编辑内容), `hasChanges` (是否有变更), `saveError`
- **关键逻辑**:
  - 模板加载时自动填充 `systemPrompt`
  - 变更检测：编辑后 `hasChanges` 为 true
  - `handleReset`: 恢复到模板原始内容
  - `handleSave`: 调用 `onSave` 回调，成功后重置变更状态
  - 字符计数实时显示
  - 模板版本号显示（如有）
- **UI 结构**: 白色卡片，头部（角色图标 + 名称 + 关闭按钮），textarea 编辑区（12 行），字符计数 + 版本号，保存/重置/预览按钮

## 依赖关系
- `react`: useState, useCallback, useEffect
- `@/shared/types`: AgentRole
- `../types`: PromptTemplate, AGENT_ROLE_META

## 注意事项
- 保存后 `hasChanges` 重置为 false，按钮禁用
- 加载中显示旋转动画，不显示编辑器
- textarea 使用 `font-mono` 等宽字体