# m16_artifact_editor/hooks/useArtifacts.ts — 产出物数据 Hooks

## 概述
产出物编辑器模块的核心数据 Hooks 集合，包含 3 个 Hook：`useArtifacts`（产出物列表，按阶段分组）、`useArtifactDetail`（产出物详情）、`useVersionDiff`（版本对比，含前端 diff 算法）。

## Hook 详细说明

### useArtifacts(projectId)
- **功能**: 获取产出物列表并按 IPD 阶段分组
- **参数**: `projectId` (string)
- **返回值**: `{ stagedArtifacts, isLoading, error, reload }`
- **关键逻辑**: 
  - 按 IPD 阶段顺序（concept -> lifecycle）分组，无产出物的阶段也显示空数组
  - 使用 IIFE 立即执行分组逻辑

### useArtifactDetail(artifactId)
- **功能**: 获取产出物详情
- **参数**: `artifactId` (string)
- **返回值**: `{ artifact, isLoading, error, reload }`

### useVersionDiff(artifactId)
- **功能**: 版本对比，含前端行级 diff 算法
- **参数**: `artifactId` (string)
- **返回值**: `{ diff, isComparing, diffError, compareVersions, clearDiff }`
- **关键逻辑**:
  - `computeDiff(oldText, newText)`: 前端实现的行级 diff 算法
    - 同时遍历新旧文本行
    - 相同行标记为 `unchanged`
    - 新增行：在新版本中查找旧行位置，标记中间行为 `added`
    - 删除行：在旧版本中查找新行位置，标记中间行为 `removed`
    - 无法匹配的行标记为替换（一条 removed + 一条 added）
  - `compareVersions`: 并行获取两个版本内容，执行 diff 计算
  - `clearDiff`: 清除对比结果

## 依赖关系
- `react`: useState, useEffect, useCallback
- `../types`: Artifact, ArtifactListItem, StagedArtifacts, VersionDiff, STAGE_LABELS
- `../api`: fetchArtifactsAPI, fetchArtifactAPI, fetchVersionAPI
- `@/shared/types`: IPDStage

## 注意事项
- `computeDiff` 是简易的行级 diff，不保证最优结果，但 MVP 阶段足够
- 版本对比需要并行获取两个版本的内容（`Promise.all`）
- 分组时使用 IPD 阶段固定顺序，确保 UI 一致性