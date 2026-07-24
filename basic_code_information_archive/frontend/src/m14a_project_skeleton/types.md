# m14a_project_skeleton/types.ts — 项目详情模块类型定义（M14b 扩展版）

## 概述
定义项目详情页（M14a/M14b）所需的全部类型，包括基础类型和 M14b 新增的对话消息、推理摘要、恢复动作、引导步骤等类型。

## M14a 基础类型

### ProjectStatus
- **功能**: 项目状态
- **可选值**: `'active'` | `'paused'` | `'completed'` | `'archived'`

### ProjectDetail
- **功能**: 项目详情（扩展 Project）
- **字段**: `id`, `name`, `description`, `complexity`, `currentStage`, `status`, `progress`, `createdAt`, `updatedAt`, `industry`, `targetWeeks`, `teamSize`, `budgetLimit`

### StageDetail
- **功能**: 阶段详情
- **字段**: `stage`, `label`, `description`, `status` ('completed'|'current'|'pending'), `startedAt`, `completedAt`

### ActivityStatus
- **功能**: 活动状态
- **可选值**: `'pending'` | `'in_progress'` | `'completed'` | `'skipped'`

### Activity
- **功能**: 活动项
- **字段**: `id`, `name`, `description`, `status`, `isSkippable`, `assignee`, `deadline`

### GateStatusData
- **功能**: 门禁状态
- **字段**: `name`, `label`, `stage`, `status` ('pending'|'voting'|'passed'|'failed'), `description`

### StageResponse
- **功能**: 当前阶段响应
- **字段**: `currentStage` (StageDetail), `allStages` (StageDetail[])

## M14b 新增类型

### 消息系统类型

#### MessageSender
- **功能**: 消息发送者角色
- **可选值**: `'user'` | `'product_manager'` | `'rd'` | `'qa'` | `'marketing'` | `'manufacturing'` | `'finance'`

#### MessageType
- **功能**: 消息类型
- **可选值**: `'user_prompt'` | `'response'` | `'system'`

#### ChatMessage
- **功能**: 对话消息
- **字段**: `id`, `projectId`, `sender` (MessageSender), `senderLabel`, `messageType` (MessageType), `content`, `stage`, `createdAt`

#### ReasoningSummary
- **功能**: 推理摘要
- **字段**: `agentRole`, `reasoningChain` (string[]), `conclusion`, `timestamp`

#### StreamMessageEvent
- **功能**: WebSocket 流式消息事件
- **字段**: `type` ('token'|'done'|'summary'|'error'), `content`, `agentRole`, `summary` (ReasoningSummary), `error`

### 活动操作类型

#### ActivityAction
- **功能**: 活动操作类型
- **可选值**: `'start'` | `'skip'` | `'complete'` | `'bypass'`

#### ActivityActionRequest
- **功能**: 活动操作请求体
- **字段**: `activityId`, `action` (ActivityAction), `input`, `bypassType`

### 阶段控制类型

#### StageAdvanceRequest
- **功能**: 阶段推进请求
- **字段**: `targetStage` (IPDStage)

#### StageRollbackRequest
- **功能**: 阶段回退请求
- **字段**: `targetStage` (IPDStage), `reason` (string)

### 门禁投票类型

#### GateVoteRequest
- **功能**: 门禁投票请求
- **字段**: `gateId`, `vote` ('approve'|'reject'|'abstain'), `comment`

#### GateVoteResult
- **功能**: 门禁投票结果
- **字段**: `gateId`, `vote`, `voter`, `comment`, `timestamp`

### 异常恢复类型

#### RecoveryActionType
- **功能**: 恢复动作类型
- **可选值**: `'regenerate'` | `'switch_model'` | `'moderator_decide'` | `'restart_debate'` | `'proceed_with_issues'`

#### RecoveryAction
- **功能**: 恢复动作
- **字段**: `id`, `type` (RecoveryActionType), `title`, `description`, `options` (RecoveryOption[])

### 引导类型

#### OnboardingStep
- **功能**: 引导步骤
- **字段**: `id`, `title`, `description`, `target` (string)

#### OnboardingState
- **功能**: 引导状态
- **字段**: `isFirstVisit`, `completedSteps` (string[])

## 常量映射

| 常量名 | 说明 |
|--------|------|
| `STAGE_LABELS` | IPD 阶段中文标签 |
| `STAGE_DESCRIPTIONS` | IPD 阶段描述文本 |
| `ACTIVITY_STATUS_LABELS` | 活动状态标签 |
| `PROJECT_STATUS_LABELS` | 项目状态标签 |

## 依赖关系
- 导入 `IPDStage`, `ComplexityTier` from `@/shared/types`
- 导入 `AgentRole` from `@/shared/types`

## 注意事项
- M14b 类型在文件后半部分（95-206 行），与 M14a 类型清晰分隔
- `RecoveryAction.options` 包含 `label`, `action`, `type` 三个字段
- 所有 M14b 类型均通过 `api.ts` 和组件使用