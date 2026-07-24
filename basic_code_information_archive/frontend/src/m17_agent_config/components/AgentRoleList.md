# m17_agent_config/components/AgentRoleList.tsx — Agent 角色列表组件

## 概述
以卡片网格展示 6 个 Agent 角色，每个角色显示图标、名称、描述，以及"查看提示词"和"测试"两个操作按钮。

## 组件详细说明

### AgentRoleList({ onViewPrompt, onTestRole, disabled })
- **功能**: Agent 角色列表 UI 组件
- **Props**: 
  - `onViewPrompt` (function) — 查看提示词回调
  - `onTestRole` (function) — 测试角色回调
  - `disabled?` (boolean)
- **关键逻辑**: 使用 `AGENT_ROLE_META` 常量渲染 6 个角色卡片
- **UI 结构**: 白色卡片，3 列网格布局（响应式：1 列/2 列/3 列），每个角色卡片包含图标 + 名称 + 描述 + 操作按钮

## 依赖关系
- `@/shared/types`: AgentRole
- `../types`: AGENT_ROLE_META

## 注意事项
- 角色图标使用 emoji（📋💻🧪📊🏭💰）
- 按钮使用 `flex-1` 等宽分布