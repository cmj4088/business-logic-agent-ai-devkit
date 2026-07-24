# m17_agent_config/components/ModelParamsPanel.tsx — 模型参数面板组件

## 概述
高级参数配置面板，可折叠展开。提供 Temperature 和 Max Tokens 的滑块调节，以及 4 个快速预设（精确模式、默认模式、创意模式、长文模式）。

## 组件详细说明

### ModelParamsPanel({ temperature, maxTokens, onTemperatureChange, onMaxTokensChange, disabled })
- **功能**: 模型参数面板 UI 组件
- **Props**: 
  - `temperature` (number) — 温度参数
  - `maxTokens` (number) — 最大 Token 数
  - `onTemperatureChange` (function) — 温度变更回调
  - `onMaxTokensChange` (function) — Token 变更回调
  - `disabled?` (boolean)
- **状态管理**: `localTemp`, `localTokens` (本地值), `isExpanded` (折叠状态)
- **关键逻辑**:
  - Temperature 范围 0.0-2.0，步长 0.1
  - Max Tokens 范围 1024-128000，步长 1024
  - 滑块使用 CSS `linear-gradient` 实现渐变填充效果
  - 失焦时 clamp 值到有效范围并四舍五入到步长
  - 4 个快速预设：精确(0.2/16K)、默认(0.7/32K)、创意(1.2/64K)、长文(0.7/128K)
- **UI 结构**: 可折叠卡片，Temperature 滑块 + Max Tokens 滑块 + 快速预设按钮

## 依赖关系
- `react`: useState, useCallback, useEffect

## 注意事项
- 滑块使用 `accent-indigo-600` 样式，但 `linear-gradient` 覆盖了默认样式
- 预设按钮点击时直接提交变更，不等待失焦