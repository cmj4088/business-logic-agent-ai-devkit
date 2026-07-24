# m16_artifact_editor/components/ArtifactViewer.tsx — 产出物查看器组件

## 概述
产出物查看器，将 Markdown 内容渲染为 HTML 显示。同时展示产出物的元数据信息（名称、描述、类型、阶段、状态、版本号、更新日期、AI 标识）和编辑按钮。

## 组件详细说明

### ArtifactViewer({ artifact, onEdit })
- **功能**: 产出物查看器 UI 组件
- **Props**: 
  - `artifact` (Artifact) — 产出物数据
  - `onEdit?` (function) — 编辑按钮回调
- **关键逻辑**:
  - 使用 `useMemo` 缓存渲染后的 HTML（依赖 `artifact.content`）
  - 元信息标签使用圆角药丸样式显示
  - Markdown 内容通过 `dangerouslySetInnerHTML` 渲染
- **UI 结构**: 元信息头部卡片 + Markdown 渲染内容卡片

## 依赖关系
- `react`: useMemo
- `../markdown`: renderMarkdown
- `./AIBadge`: AIBadge
- `../types`: Artifact, ARTIFACT_TYPE_LABELS, ARTIFACT_STATUS_LABELS, STAGE_LABELS

## 注意事项
- 使用 `dangerouslySetInnerHTML` 渲染 HTML，需确保 `renderMarkdown` 已做 XSS 防护
- `useMemo` 确保只在内容变化时重新渲染 Markdown