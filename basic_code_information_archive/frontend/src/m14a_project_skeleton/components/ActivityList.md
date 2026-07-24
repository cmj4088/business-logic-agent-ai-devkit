# m14a_project_skeleton/components/ActivityList.tsx — 活动列表组件（交互版）

## 概述
M14b 阶段完成的活动列表组件，集成活动交互操作。每个活动使用 ActivityInteraction 卡片组件，支持开始、跳过、完成（含人工输入）和 bypass 操作。

## 组件详细说明

### ActivityList({ projectId, activities, onActivityChange })
- **功能**: 活动列表 + 交互操作
- **Props**:
  - `projectId` (string): 项目 ID
  - `activities` (Activity[]): 活动列表
  - `onActivityChange` (function): 活动变更回调（通知父组件刷新）
- **关键逻辑**:
  - 使用 `useActivityActions(projectId)` Hook 管理操作状态
  - 每个活动渲染为 ActivityInteraction 卡片组件
  - 人工输入通过 HumanInputModal 弹窗处理
  - 操作完成后调用 `onActivityChange` 通知父组件
  - 空列表显示"当前阶段暂无活动"

## 交互流程

```
用户点击"开始" → start(activityId) → 刷新活动列表
用户点击"跳过" → skip(activityId) → 刷新活动列表
用户点击"完成" → 打开 HumanInputModal → 输入文本 → complete(activityId, input) → 刷新
用户点击"绕过" → 打开 HumanInputModal → 选择 bypass 模式 → bypass(activityId, mode) → 刷新
```

## UI 结构
- 列表容器：每个活动一行
- 活动行：ActivityInteraction 卡片（状态颜色 + 操作按钮）
- 弹窗层：HumanInputModal（完成/绕过时弹出）

## 依赖关系
- `react`: FC, useState
- `../hooks/useActivityActions`: useActivityActions
- `./ActivityInteraction`: ActivityInteraction
- `./HumanInputModal`: HumanInputModal
- `../types`: Activity

## 注意事项
- 操作状态通过 `isActing` 全局控制，防止并发操作
- `onActivityChange` 在每次操作成功后调用，触发父组件刷新
- 相比 M14a 纯展示版，现在是完整的交互实现
- bypass 模式由 HumanInputModal 内部处理，父组件只需传入 `onBypass` 回调