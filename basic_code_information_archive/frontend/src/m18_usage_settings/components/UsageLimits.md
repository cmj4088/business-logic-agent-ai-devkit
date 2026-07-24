# m18_usage_settings/components/UsageLimits.tsx — 用量限制配置组件

## 概述
配置每日和每月的 Token 用量上限，支持启用/禁用开关。保存后显示成功/失败提示。

## 组件详细说明

### UsageLimitsComponent({ limits, onSave })
- **功能**: 用量限制配置 UI 组件
- **Props**: 
  - `limits` (UsageLimits) — 当前限制配置
  - `onSave` (function) — 保存回调，返回 Promise<boolean>
- **状态管理**: `dailyLimit`, `monthlyLimit`, `dailyEnabled`, `monthlyEnabled`, `isSaving`, `message`
- **关键逻辑**:
  - 使用 `useEffect` 同步外部 `limits` 变化到本地状态
  - 禁用时输入框 `disabled` + 灰色背景
  - 保存后根据 `onSave` 返回值显示成功/失败消息
- **UI 结构**: 标题 + 每日上限行（输入框 + tokens 单位 + 启用开关）+ 每月上限行 + 保存按钮 + 消息

## 依赖关系
- `react`: React, useState, useEffect
- `../types`: UsageLimits

## 注意事项
- 数字输入框的 `min` 属性为 0
- 保存按钮在 `isSaving` 时禁用并显示"保存中..."