# m16_artifact_editor/api.ts — 产出物编辑器 API 调用层

## 概述
产出物编辑器模块的 API 调用封装，包含产出物 CRUD、版本管理、重新生成、附件上传/删除等 9 个 API 函数。

## 函数详细说明

### fetchArtifactsAPI(projectId)
- **功能**: 获取产出物列表
- **返回值**: `Promise<ArtifactListItem[]>`
- **API 端点**: `GET /api/projects/{projectId}/artifacts`

### fetchArtifactAPI(artifactId)
- **功能**: 获取产出物详情
- **返回值**: `Promise<Artifact>`
- **API 端点**: `GET /api/artifacts/{artifactId}`

### updateArtifactAPI(artifactId, data)
- **功能**: 更新产出物（创建新版本）
- **返回值**: `Promise<Artifact>`
- **API 端点**: `PUT /api/artifacts/{artifactId}`

### deleteArtifactAPI(artifactId)
- **功能**: 软删除产出物
- **返回值**: `Promise<void>`
- **API 端点**: `DELETE /api/artifacts/{artifactId}`

### fetchVersionsAPI(artifactId)
- **功能**: 获取版本历史
- **返回值**: `Promise<ArtifactVersion[]>`
- **API 端点**: `GET /api/artifacts/{artifactId}/versions`

### fetchVersionAPI(artifactId, version)
- **功能**: 获取特定版本
- **返回值**: `Promise<ArtifactVersion>`
- **API 端点**: `GET /api/artifacts/{artifactId}/versions/{version}`

### regenerateArtifactAPI(data)
- **功能**: 重新生成产出物（M10 异常恢复）
- **返回值**: `Promise<RegenerateResponse>`
- **API 端点**: `POST /api/recovery/regenerate/{artifactId}`

### uploadAttachmentAPI(artifactId, file, onProgress?)
- **功能**: 上传附件（支持进度回调）
- **参数**: `artifactId`, `file` (File), `onProgress?` (回调函数)
- **返回值**: `Promise<Artifact>`
- **API 端点**: `PUT /api/artifacts/{artifactId}/attachments`
- **关键逻辑**: 使用 `FormData` 上传文件，`onUploadProgress` 回调进度

### deleteAttachmentAPI(artifactId, attachmentId)
- **功能**: 删除附件
- **返回值**: `Promise<void>`
- **API 端点**: `DELETE /api/artifacts/{artifactId}/attachments/{attachmentId}`

### createArtifactAPI(data)
- **功能**: 创建产出物
- **返回值**: `Promise<Artifact>`
- **API 端点**: `POST /api/artifacts`

## 依赖关系
- 导入 `get`, `post`, `put`, `del` from `@/shared/api-client`
- 导入各种类型 from `./types`

## 注意事项
- `uploadAttachmentAPI` 使用动态 `import` 获取 `apiClient` 实例以设置 `multipart/form-data` 头
- `deleteArtifactAPI` 为软删除，非物理删除