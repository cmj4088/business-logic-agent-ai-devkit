# m14a_project_skeleton/components/GateStatus.tsx — 门禁状态组件

## 概述
展示当前阶段的各个门禁状态，使用彩色标签显示通过/失败/投票中/待处理状态。

## 组件详细说明

### GateStatus({ gates })
- **功能**: 门禁状态 UI 组件
- **Props**: `gates` (GateStatusData[])
- **关键逻辑**:
  - 空列表显示"当前阶段无门禁检查"
  - 状态图标映射：passed 对勾、failed 叉号、voting 半圆、pending 方框
  - 状态颜色映射：passed 绿色、failed 红色、voting 琥珀色、pending 灰色
  - 每个门禁标签的 `title` 属性显示详细描述
- **UI 结构**: 白色卡片，头部标题"门禁状态"，标签横向排列

## 依赖关系
- `react`: FC
- `../types`: GateStatusData

## 注意事项
- 门禁使用 `flex-wrap` 布局，自动换行
- `title` 属性提供 hover 提示