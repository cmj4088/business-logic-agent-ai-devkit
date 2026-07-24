# m18_usage_settings/components/BudgetAlerts.tsx — 预算预警配置组件

## 概述
配置预算预警阈值，当预算使用率达到设定百分比时触发提醒。包含预警线预览进度条。

## 组件详细说明

### BudgetAlertsComponent({ alerts, onSave })
- **功能**: 预算预警配置 UI 组件
- **Props**: 
  - `alerts` (BudgetAlerts) — 当前预警配置
  - `onSave` (function) — 保存回调
- **状态管理**: `thresholdPercent`, `enabled`, `isSaving`, `message`
- **关键逻辑**:
  - 预警百分比范围 1-100
  - 预览进度条：蓝色填充 + 红色预警线标记
  - 进度条模拟使用率（预警线 - 10% 的位置）
- **UI 结构**: 标题 + 百分比输入 + 启用开关 + 预览进度条 + 保存按钮 + 消息

## 依赖关系
- `react`: React, useState, useEffect
- `../types`: BudgetAlerts

## 注意事项
- 预览进度条为静态模拟，非真实数据
- 预警线使用红色竖线（`w-0.5`）标记