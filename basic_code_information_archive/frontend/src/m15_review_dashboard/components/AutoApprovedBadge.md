# m15_review_dashboard/components/AutoApprovedBadge.tsx — 自动通过标识组件

## 概述
显示"自动通过"标识，用于单人模式下自动通过的审核项。可选显示详细说明文字。

## 组件详细说明

### AutoApprovedBadge({ showDetail })
- **功能**: 自动通过标识 UI 组件
- **Props**: `showDetail?` (boolean) — 是否显示详细说明
- **关键逻辑**: 
  - 基础显示：对勾图标 + "自动通过"文字
  - `showDetail` 为 true 时额外显示"单人模式：自动通过，未经人工实质审查"说明
- **UI 结构**: 灰色圆角标签，可选详细说明文字

## 依赖关系
- 无外部依赖

## 注意事项
- 这是一个纯展示组件，无交互逻辑
- 在 `ReviewList` 和 `ReviewDetail` 中均被使用