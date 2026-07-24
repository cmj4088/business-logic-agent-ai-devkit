# m16_artifact_editor/index.tsx — 产出物编辑器入口页面

## 概述
产出物编辑器模块的入口，导出两个页面组件：`ArtifactListPage`（产出物列表页）和 `ArtifactDetailPage`（产出物详情/编辑页）。详情页支持查看/编辑模式切换、版本对比和附件管理。

## 组件详细说明

### ArtifactListPage()
- **功能**: 产出物列表页面
- **路由**: `/projects/:id/artifacts`
- **UI 结构**: 渲染 `ArtifactList` 组件

### ArtifactDetailPage()
- **功能**: 产出物详情/编辑页面
- **路由**: `/projects/:id/artifacts/:artifactId`
- **关键逻辑**:
  - 通过 URL 参数 `edit=true` 控制编辑模式
  - `handleEdit`: 进入编辑模式，设置 URL 参数
  - `handleCancelEdit`: 退出编辑模式，清除 URL 参数
  - `handleSaved`: 保存成功后退出编辑模式并刷新
  - `handleRegenerated`: 重新生成后刷新
  - `handleCompare`: 触发版本对比
  - 边界状态：加载中、错误、产出物不存在
  - 版本对比中显示加载动画
- **UI 结构**: 
  - 标题栏 + 重新生成按钮
  - 查看器（ArtifactViewer）或编辑器（ArtifactEditor）
  - 版本对比视图（VersionDiff）
  - 底部双栏：版本历史 + 附件管理

## 依赖关系
- `react`: useState, useCallback
- `react-router-dom`: useParams, useSearchParams
- `./hooks/useArtifacts`: useArtifactDetail, useVersionDiff
- `./components/*`: ArtifactList, ArtifactViewer, ArtifactEditor, VersionHistory, VersionDiff, AttachmentManager, RegenerateButton
- `./types`: Artifact, RegenerateResponse

## 注意事项
- 编辑模式通过 URL 参数 `?edit=true` 控制，支持浏览器前进/后退
- 重新生成按钮使用 `RegenerateButton` 组件，弹出对话框输入原因