# m14a_project_skeleton/api.ts — 项目详情模块 API 调用层（M14b 扩展版）

## 概述
项目详情页的 API 调用封装，包含 M14a 基础 API 和 M14b 新增的 15+ 个 API 函数，覆盖对话消息、活动操作、阶段控制、门禁投票、异常恢复和引导功能。

## M14a 基础 API

### fetchProjectDetail(id)
- **功能**: 获取项目详情
- **API 端点**: `GET /api/projects/{id}`
- **返回值**: `Promise<ProjectDetail>`

### fetchStageDetail(id)
- **功能**: 获取当前阶段详情
- **API 端点**: `GET /api/projects/{id}/stage`
- **返回值**: `Promise<StageResponse>`

### fetchActivities(id)
- **功能**: 获取活动列表
- **API 端点**: `GET /api/projects/{id}/activities`
- **返回值**: `Promise<Activity[]>`

### fetchGateStatus(id)
- **功能**: 获取门禁状态
- **API 端点**: `GET /api/projects/{id}/gates`
- **返回值**: `Promise<GateStatusData[]>`

## M14b 新增 API

### 对话消息 API

#### fetchMessages(projectId, stage?)
- **功能**: 获取历史消息
- **API 端点**: `GET /api/projects/{projectId}/messages?stage={stage}`
- **返回值**: `Promise<ChatMessage[]>`

#### sendMessage(projectId, content)
- **功能**: 发送用户消息
- **API 端点**: `POST /api/projects/{projectId}/messages`
- **请求体**: `{ content }`
- **返回值**: `Promise<ChatMessage>`

### 活动操作 API

#### performActivityAction(projectId, request)
- **功能**: 执行活动操作（开始/跳过/完成/bypass）
- **API 端点**: `POST /api/projects/{projectId}/activities/{activityId}/action`
- **请求体**: `ActivityActionRequest`
- **返回值**: `Promise<Activity>`

### 阶段控制 API

#### advanceStage(projectId, targetStage)
- **功能**: 推进阶段
- **API 端点**: `POST /api/projects/{projectId}/stage/advance`
- **请求体**: `{ targetStage }`
- **返回值**: `Promise<StageResponse>`

#### rollbackStage(projectId, targetStage, reason)
- **功能**: 回退阶段
- **API 端点**: `POST /api/projects/{projectId}/stage/rollback`
- **请求体**: `{ targetStage, reason }`
- **返回值**: `Promise<StageResponse>`

#### pauseProject(projectId)
- **功能**: 暂停项目
- **API 端点**: `POST /api/projects/{projectId}/pause`
- **返回值**: `Promise<ProjectDetail>`

#### resumeProject(projectId)
- **功能**: 恢复项目
- **API 端点**: `POST /api/projects/{projectId}/resume`
- **返回值**: `Promise<ProjectDetail>`

### 门禁投票 API

#### submitGateVote(projectId, request)
- **功能**: 提交门禁投票
- **API 端点**: `POST /api/projects/{projectId}/gates/{gateId}/vote`
- **请求体**: `GateVoteRequest`
- **返回值**: `Promise<GateVoteResult>`

### 异常恢复 API

#### fetchRecoveryStatus(projectId)
- **功能**: 获取异常恢复状态
- **API 端点**: `GET /api/projects/{projectId}/recovery`
- **返回值**: `Promise<RecoveryStatus>`

#### executeRecoveryAction(projectId, actionId, resolution)
- **功能**: 执行恢复动作
- **API 端点**: `POST /api/projects/{projectId}/recovery/{actionId}/execute`
- **请求体**: `{ resolution }`
- **返回值**: `Promise<void>`

### 引导 API

#### fetchOnboardingState()
- **功能**: 获取引导状态
- **API 端点**: `GET /api/onboarding/state`
- **返回值**: `Promise<OnboardingState>`

#### completeOnboardingStep(stepId)
- **功能**: 完成引导步骤
- **API 端点**: `POST /api/onboarding/steps/{stepId}/complete`
- **返回值**: `Promise<void>`

## 依赖关系
- 导入 `get`, `post`, `put` from `@/shared/api-client`
- 导入 M14a 类型: `ProjectDetail`, `StageResponse`, `Activity`, `GateStatusData`
- 导入 M14b 类型: `ChatMessage`, `ActivityActionRequest`, `GateVoteRequest`, `GateVoteResult`, `RecoveryStatus`, `OnboardingState`

## 注意事项
- 所有 API 端点以项目 ID 为路径参数
- M14b API 函数在文件后半部分（37-148 行），与 M14a 基础 API 清晰分隔
- `sendMessage` 返回用户消息对象，Agent 回复通过 WebSocket 推送
- 恢复状态通过 `fetchRecoveryStatus` 轮询，WebSocket 推送触发刷新