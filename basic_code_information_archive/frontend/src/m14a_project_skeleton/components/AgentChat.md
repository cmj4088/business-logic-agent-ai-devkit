# m14a_project_skeleton/components/AgentChat.tsx — Agent 对话区组件（流式输出版）

## 概述
M14b 阶段完成的 Agent 对话区组件，集成流式输出、推理摘要折叠和历史消息展示。支持 6 个 Agent 角色的对话，实时显示 LLM 生成内容。

## 组件详细说明

### AgentChat (FC)
- **功能**: Agent 对话区，支持流式输出和推理摘要
- **Props**: `AgentChatProps`
  - `projectId` (string): 项目 ID
  - `stage` (IPDStage): 当前阶段
- **关键逻辑**:
  - 使用 `useAgentChat(projectId, stage)` Hook 管理所有对话状态
  - 消息列表按时间顺序展示，每条消息显示：
    - 发送者角色 + 颜色标签
    - 消息内容（Markdown 格式）
    - 时间戳
  - 流式输出区域：
    - 显示当前正在输出的 Agent 角色
    - 实时更新内容（打字光标动画）
    - 完成后自动追加到消息列表
  - 推理摘要（ReasoningSummaryCard）：
    - 可折叠面板
    - 显示 Agent 推理逻辑链
    - 仅在 `summary` 不为 null 时显示

## UI 结构
- 头部：标题"Agent 对话区" + 说明文字
- 消息列表区：滚动容器，展示历史消息 + 流式内容
  - 空状态：聊天图标 + "暂无对话记录"（无历史消息时）
  - 加载中：旋转动画（isLoadingHistory 时）
- 流式输出区：打字动画 + 角色标签
- 推理摘要：可折叠的 ReasoningSummaryCard
- 底部输入区：真实文本输入框 + 发送按钮（Enter 发送，Shift+Enter 换行）

## 角色颜色映射
每个 Agent 角色有独特的颜色标签，用于区分消息来源。

## 依赖关系
- `react`: FC
- `../hooks/useAgentChat`: useAgentChat
- `../types`: ChatMessage, ReasoningSummary

## 注意事项
- 流式输出通过 WebSocket 实时接收，无需轮询
- 消息列表使用 `useRef` 自动滚动到底部
- 发送按钮在 `isStreaming` 时禁用
- 推理摘要仅在 Agent 完成推理后显示
- 相比 M14a 骨架版，现在是完整的交互实现