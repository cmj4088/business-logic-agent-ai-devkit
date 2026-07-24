# m16_artifact_editor/components/ArtifactEditor.tsx — Markdown 编辑器组件

## 概述
Markdown 编辑器，左侧为编辑区（textarea），右侧为实时预览。保存时创建新版本（变更说明必填）。支持预览区的显示/隐藏切换。

## 组件详细说明

### ArtifactEditor({ artifact, onSaved, onCancel })
- **功能**: Markdown 编辑器 UI 组件
- **Props**: 
  - `artifact` (Artifact) — 产出物数据
  - `onSaved` (function) — 保存成功回调
  - `onCancel` (function) — 取消编辑回调
- **状态管理**: `content` (编辑内容), `changeSummary` (变更说明), `isSaving`, `saveError`, `showPreview`
- **关键逻辑**:
  - 初始内容为 `artifact.content`
  - `hasChanges`: 判断内容是否变更
  - `handleSave`: 验证变更说明非空后调用 `updateArtifactAPI`
  - 预览使用 `useMemo` 实时渲染 Markdown
  - 保存按钮在无变更或变更说明为空时禁用
  - 提示文字说明"编辑将创建新版本 v{currentVersion + 1}"
- **UI 结构**: 标题栏 + 变更说明输入 + 编辑/预览分屏（可切换）

## 依赖关系
- `react`: useState, useCallback, useMemo
- `../markdown`: renderMarkdown
- `../types`: Artifact, UpdateArtifactRequest
- `../api`: updateArtifactAPI

## 注意事项
- 每次保存创建新版本（非覆盖），旧版本保留
- 预览区可通过按钮切换显示/隐藏
- 编辑区最小高度 500px，可垂直拖拽调整