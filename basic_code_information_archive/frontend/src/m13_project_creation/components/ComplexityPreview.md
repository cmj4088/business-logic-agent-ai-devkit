# m13_project_creation/components/ComplexityPreview.tsx — 复杂度预览组件

## 概述
根据项目配置实时展示复杂度预览信息，包括复杂度级别、判定原因、活动数量和预计周期。

## 组件详细说明

### TIER_LABELS
- **功能**: 复杂度级别中文标签
- **值**: `{ auto: '自动', lite: '轻量模式', standard: '标准模式', full: '完整模式' }`

### TIER_COLORS
- **功能**: 复杂度级别对应的颜色样式
- **值**: `{ auto: slate, lite: green, standard: blue, full: purple }`

### ComplexityPreview({ preview })
- **功能**: 复杂度预览 UI 组件
- **Props**: `preview` (ComplexityPreviewType) — 复杂度预览数据
- **UI 结构**: 白色卡片，显示级别标签、原因、活动数、预计周期

## 依赖关系
- `../types`: ComplexityPreview as ComplexityPreviewType

## 注意事项
- 复杂度级别标签使用圆角药丸样式（rounded-full）
- 颜色根据级别自动变化，帮助用户快速识别复杂度