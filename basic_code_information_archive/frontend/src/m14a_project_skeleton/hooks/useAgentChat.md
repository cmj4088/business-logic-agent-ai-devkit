# m14a_project_skeleton/hooks/useAgentChat.ts — Agent 对话 Hook（流式输出 + 推理摘要）

## 概述
M14b 新增 Hook，管理 Agent 对话的完整生命周期：加载历史消息、通过 WebSocket 接收流式输出、实时显示推理摘要、发送用户消息。支持多轮辩论和 Agent 协作场景。

## Hook 详细说明

### useAgentChat(projectId, stage?)
- **功能**: Agent 对话的完整状态管理
- **参数**:
  - `projectId` (string) — 项目 ID
  - `stage` (string, 可选) — 当前阶段（用于过滤消息）
- **返回值**: `UseAgentChatReturn`
  - `messages` (ChatMessage[]): 消息列表
  - `isLoadingHistory` (boolean): 是否正在加载历史消息
  - `isStreaming` (boolean): 是否正在接收流式输出
  - `streamingContent` (string): 当前流式输出的内容
  - `streamingAgent` (string): 当前流式输出的 Agent 角色
  - `summary` (ReasoningSummary | null): 推理摘要
  - `send` (async function): 发送用户输入
  - `reload` (async function): 重新加载历史消息
  - `error` (string | null): 错误信息

## 关键逻辑

### 历史消息加载
- 使用 `fetchMessages(projectId, stage)` 从 REST API 获取历史消息
- 初始加载和手动刷新均通过 `loadHistory` 函数
- 加载状态通过 `isLoadingHistory` 暴露

### WebSocket 流式接收
- 连接地址: `ws://localhost:8000/ws/rounds/{projectId}?token={jwt}`
- 处理 4 种事件类型:
  - `token`: 逐字流式输出，追加到 `streamingBuffer`，实时更新 `streamingContent`
  - `done`: 流式输出结束，将 buffer 转为完整 `ChatMessage` 加入消息列表
  - `summary`: 接收推理摘要，存储到 `summary` 状态
  - `error`: 流式错误，设置 `error` 状态

### 消息发送
- 调用 `sendMessage(projectId, content)` API
- 发送成功后立即将用户消息加入本地列表
- 用户消息不通过 WebSocket 返回

### WebSocket 生命周期
- 依赖 `projectId` 和 `stage` 变化时重新建立连接
- 组件卸载时自动关闭 WebSocket（cleanup 函数）
- 异常关闭（非 1000）时设置错误提示

## 依赖关系
- `react`: useState, useEffect, useCallback, useRef
- `../types`: ChatMessage, ReasoningSummary
- `../api`: fetchMessages, sendMessage, StreamMessageEvent

## 注意事项
- WebSocket 连接使用 localStorage 中的 JWT token 认证
- `streamingBuffer` 使用 useRef 避免闭包问题
- 流式内容结束后自动清空 buffer 和 streamingContent
- WebSocket 重连逻辑当前未实现，断开后需手动刷新