# m16_artifact_editor/components/AttachmentManager.tsx — 附件管理组件

## 概述
附件管理组件，支持上传（带进度条）、下载、删除附件。上传使用 FormData 和进度回调。

## 组件详细说明

### AttachmentManager({ artifactId, attachments, onAttachmentsChanged })
- **功能**: 附件管理 UI 组件
- **Props**: 
  - `artifactId` (string) — 产出物 ID
  - `attachments` (Attachment[]) — 附件列表
  - `onAttachmentsChanged` (function) — 附件变更回调（上传/删除后触发）
- **状态管理**: `uploadProgress` (上传进度), `isUploading`, `deleteId` (正在删除的附件 ID), `error`
- **关键逻辑**:
  - `handleUpload`: 选择文件后上传，实时更新进度条
  - `handleDelete`: 删除附件，删除中按钮禁用
  - `formatFileSize`: 格式化文件大小（B/KB/MB）
  - 上传完成后重置 `fileInput` 以支持重复上传同名文件
- **UI 结构**: 白色卡片，标题"附件" + 数量，上传按钮 + 进度条 + 附件列表（下载/删除按钮）

## 依赖关系
- `react`: useState, useCallback, useRef
- `../types`: Attachment, UploadProgress
- `../api`: uploadAttachmentAPI, deleteAttachmentAPI

## 注意事项
- 上传使用隐藏的 `<input type="file">` 触发文件选择
- 进度条使用 `transition-all duration-300` 实现平滑过渡
- 删除按钮在删除中显示 `disabled:opacity-50`