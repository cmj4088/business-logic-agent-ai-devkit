# m16_artifact_editor/components/AIBadge.tsx — AI 生成标识组件

## 概述
显示产出物的 AI 生成标识和可信度信息。如果非 AI 生成，显示"人工"标识。支持两种尺寸（sm/md）。

## 组件详细说明

### AIBadge({ aiGenerated, aiSource, size })
- **功能**: AI 生成标识 UI 组件
- **Props**: 
  - `aiGenerated` (boolean) — 是否为 AI 生成
  - `aiSource?` (AISource) — AI 来源信息
  - `size?` ('sm' | 'md') — 尺寸，默认 'md'
- **关键逻辑**:
  - 非 AI 生成：灰色标签，人物图标 + "人工"
  - AI 生成：紫色标签，机器人图标 + "AI 生成"
  - 有 `aiSource` 时显示置信度百分比
  - 置信度颜色：>= 80 绿色，>= 50 黄色，< 50 红色
  - `title` 属性显示模型名称和可信度
- **UI 结构**: 圆角药丸标签

## 依赖关系
- `../types`: AISource

## 注意事项
- 在 `ArtifactList`、`ArtifactViewer`、`VersionHistory` 中多处使用
- 置信度颜色直观反映可信度高低