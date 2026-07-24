# m14a_project_skeleton/components/StageTimeline.tsx — 阶段时间线组件

## 概述
左侧边栏的阶段时间线，展示 IPD 6 个阶段的完成状态。已完成阶段可点击查看历史，当前阶段高亮显示，未来阶段灰色显示。

## 组件详细说明

### STAGE_ORDER
- **功能**: 阶段顺序数组
- **值**: `['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle']`

### StageTimeline({ stages, currentStage, onStageClick })
- **功能**: 阶段时间线 UI 组件
- **Props**: 
  - `stages` (StageDetail[]) — 所有阶段数据
  - `currentStage` (IPDStage) — 当前阶段
  - `onStageClick?` (function) — 点击已完成阶段的回调
- **关键逻辑**:
  - `getStageStatus`: 根据数据或位置判断阶段状态（completed/current/pending）
  - 已完成阶段：绿色背景，对勾图标，可点击
  - 当前阶段：蓝色背景，环形高亮，不可点击
  - 未来阶段：灰色，不可点击
  - 阶段之间用竖线连接
- **UI 结构**: 垂直时间线，每个阶段一个节点（圆形图标 + 标签 + 描述）

## 依赖关系
- `react`: FC
- `@/shared/types`: IPDStage
- `../types`: StageDetail, STAGE_LABELS, STAGE_DESCRIPTIONS

## 注意事项
- 如果后端未返回某阶段数据，`getStageStatus` 根据 `currentStage` 位置推断状态
- 点击事件仅在 `status === 'completed'` 且 `onStageClick` 存在时触发