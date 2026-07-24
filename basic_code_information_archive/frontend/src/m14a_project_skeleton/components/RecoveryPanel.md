# m14a_project_skeleton/components/RecoveryPanel.tsx — 异常恢复面板组件

## 概述
M14b 新增组件，当 Agent 执行出错时显示可操作的恢复选项。支持 4 种异常场景，每种场景有独特的图标和颜色方案，提供主次分级操作按钮。

## 组件详细说明

### RecoveryPanel (FC)
- **功能**: 异常恢复操作面板
- **Props**: `RecoveryPanelProps`
  - `action` (RecoveryAction): 恢复动作（含标题、描述、选项列表）
  - `isExecuting` (boolean): 是否正在执行恢复
  - `onExecute` (function): 执行恢复 `(actionId: string, resolution: string) => void`
  - `onClose` (function): 关闭面板

## 4 种异常场景

| 异常类型 | 图标 | 颜色 | 场景说明 |
|---------|------|------|---------|
| `regenerate` | 🔄 | 琥珀色 | 重新生成当前产出物 |
| `switch_model` | 🔀 | 蓝色 | 切换到备用 LLM 模型 |
| `moderator_decide` | ⚖️ | 紫色 | 由人工管理员裁决 |
| `restart_debate` | 🔁 | 橙色 | 重启当前辩论轮次 |
| `proceed_with_issues` | ⚠️ | 红色 | 带问题继续推进 |

## 按钮样式分级

| 样式类型 | 视觉效果 | 使用场景 |
|---------|---------|---------|
| `primary` | 深色实心按钮 | 推荐操作 |
| `secondary` | 白色边框按钮 | 备选操作 |
| `link` | 文字链接 | 低风险操作 |

## 关键逻辑
- 通过 `ACTION_TYPE_STYLES` 映射表动态选择图标和颜色
- 每个恢复动作包含多个 `options`，每个 option 独立渲染为按钮
- 执行中 `isExecuting` 时所有按钮禁用并显示"执行中..."
- 关闭面板后从父组件列表中移除

## 依赖关系
- `react`: FC
- `../types`: RecoveryAction

## 注意事项
- 恢复动作由后端 WebSocket 推送，前端被动接收
- 面板关闭后不会自动恢复，需后端重新推送
- 每个恢复动作独立显示为一个面板，同时可存在多个