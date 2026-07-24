# m16_artifact_editor/types.ts — 产出物编辑器模块类型定义

## 概述
定义产出物编辑器模块（M16）所需的全部类型，包括产出物状态、类型、AI 来源、附件、版本、版本对比、重新生成等数据结构，以及中文标签映射常量。

## 类型定义

### ArtifactStatus
- **功能**: 产出物状态
- **可选值**: `'draft'` | `'review'` | `'approved'` | `'archived'`

### ArtifactType
- **功能**: 产出物类型
- **可选值**: `'document'` | `'spreadsheet'` | `'presentation'` | `'diagram'` | `'other'`

### AISource
- **功能**: AI 生成来源信息
- **字段**: `model` (string), `generatedAt` (string), `confidence` (number 0-100), `reason` (string)

### Attachment
- **功能**: 附件信息
- **字段**: `id`, `fileName`, `fileSize`, `fileType`, `uploadedAt`, `downloadUrl`

### ArtifactVersion
- **功能**: 产出物版本
- **字段**: `version`, `content`, `createdAt`, `createdBy`, `changeSummary`, `aiGenerated`, `aiSource?`

### Artifact
- **功能**: 产出物基本信息
- **字段**: `id`, `projectId`, `name`, `description`, `type`, `status`, `stage`, `currentVersion`, `content`, `aiGenerated`, `aiSource?`, `attachments`, `createdAt`, `updatedAt`

### ArtifactListItem
- **功能**: 产出物列表项（简化版，不含 content 和 attachments）
- **字段**: 比 Artifact 少 `content`, `attachments`, `description`

### StagedArtifacts
- **功能**: 按阶段分组的产出物
- **字段**: `stage` (IPDStage), `stageLabel` (string), `artifacts` (ArtifactListItem[])

### VersionDiff
- **功能**: 版本对比结果
- **字段**: `oldVersion`, `newVersion`, `lines` (DiffLine[])

### DiffLineType
- **功能**: 差异行类型
- **可选值**: `'added'` | `'removed'` | `'unchanged'`

### DiffLine
- **功能**: 单行差异
- **字段**: `type` (DiffLineType), `lineNumber`, `content`

### UploadProgress
- **功能**: 附件上传进度
- **字段**: `fileName`, `loaded`, `total`, `percentage`

### RegenerateRequest / RegenerateResponse
- **功能**: 重新生成请求/响应
- **字段**: `artifactId`, `reason`, `instructions?` / `artifactId`, `newVersion`, `content`, `aiSource`

### CreateArtifactRequest / UpdateArtifactRequest
- **功能**: 创建/更新产出物请求
- **字段**: `projectId`, `name`, `description`, `type`, `stage`, `content` / `content`, `changeSummary`

## 常量映射

| 常量名 | 说明 |
|--------|------|
| `STAGE_LABELS` | IPD 阶段中文标签 |
| `ARTIFACT_TYPE_LABELS` | 产出物类型标签（文档/表格/演示文稿/图表/其他） |
| `ARTIFACT_STATUS_LABELS` | 产出物状态标签（草稿/评审中/已批准/已归档） |

## 依赖关系
- 导入 `IPDStage` from `@/shared/types`

## 注意事项
- `ArtifactListItem` 是 `Artifact` 的简化版，用于列表展示
- `AISource.confidence` 范围 0-100（非 0-1）