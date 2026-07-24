# m16_artifact_editor/components/ArtifactList.tsx — 产出物列表组件

## 概述
按 IPD 阶段分组展示产出物列表，每个阶段一个卡片。每个产出物显示名称、类型图标、版本号、类型标签、更新日期、AI 标识，以及查看/编辑操作按钮。

## 组件详细说明

### ArtifactList({ projectName })
- **功能**: 产出物列表 UI 组件
- **Props**: `projectName?` (string) — 项目名称（用于标题显示）
- **关键逻辑**:
  - 使用 `useArtifacts` Hook 获取数据
  - 从 URL 参数获取 `projectId`
  - 空阶段显示"暂无产出物"
  - 每个产出物显示类型 emoji 图标（文档📝、表格📊、演示文稿📽️、图表📐、其他📄）
  - 查看按钮跳转到详情页，编辑按钮跳转到详情页并进入编辑模式
- **UI 结构**: 阶段分组卡片，每个卡片内产出物列表

## 依赖关系
- `react-router-dom`: useNavigate, useParams
- `../hooks/useArtifacts`: useArtifacts
- `./AIBadge`: AIBadge
- `../types`: ARTIFACT_TYPE_LABELS

## 注意事项
- 类型图标使用 emoji 而非 SVG，简单直观
- 编辑按钮跳转时附加 `?edit=true` 参数