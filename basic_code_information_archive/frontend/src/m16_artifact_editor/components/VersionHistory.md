# m16_artifact_editor/components/VersionHistory.tsx — 版本历史列表组件

## 概述
展示产出物的所有历史版本，支持选择两个版本进行对比。当前版本高亮显示，AI 生成的版本有 AI 标识。

## 组件详细说明

### VersionHistory({ artifactId, currentVersion, onCompare })
- **功能**: 版本历史列表 UI 组件
- **Props**: 
  - `artifactId` (string) — 产出物 ID
  - `currentVersion` (number) — 当前版本号
  - `onCompare?` (function) — 版本对比回调
- **状态管理**: `versions` (版本列表), `isLoading`, `error`, `selectedVersions` (选中的版本号数组)
- **关键逻辑**:
  - `handleToggleVersion`: 切换版本选择，最多选 2 个（新选择替换旧选择）
  - `handleCompare`: 选中 2 个版本后触发对比（自动按版本号排序）
  - 当前版本显示"当前"标签（蓝色）
  - AI 生成版本显示 `AIBadge` 标识
  - 选中的版本高亮显示（indigo 边框）
- **UI 结构**: 白色卡片，标题"版本历史" + 版本数量 + 对比按钮，版本列表

## 依赖关系
- `react`: useState, useEffect, useCallback
- `../types`: ArtifactVersion
- `../api`: fetchVersionsAPI
- `./AIBadge`: AIBadge

## 注意事项
- 最多选择 2 个版本对比，选择第 3 个时替换最早的
- 对比时自动将较小的版本号作为旧版本
- 版本列表按后端返回的顺序显示（通常为倒序）