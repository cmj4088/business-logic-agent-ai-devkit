# m14a_project_skeleton/index.tsx — 项目详情入口页面（M14b 集成版）

## 概述
项目详情页的入口组件，M14b 阶段已完成全部交互联调。采用三栏布局：左侧阶段时间线 + 中间主内容区 + 右侧面板。集成阶段推进/回退、门禁投票、异常恢复、首次引导等完整交互功能。

## 组件详细说明

### ProjectDetailPage (默认导出)
- **功能**: 项目详情页面，路由 `/projects/:id`
- **关键逻辑**:
  - 从 URL 参数获取 `id`（projectId）
  - 使用 `useProjectDetail` 获取项目数据
  - 使用 `useStageControl` 管理阶段推进/回退
  - 使用 `useProjectWS` 建立 WebSocket 连接（实时监听阶段/活动/项目变更）
  - 管理 4 个弹窗/面板状态：推进确认、回退确认、恢复面板、首次引导
  - 边界状态处理：
    - 加载中：居中旋转动画
    - 404：显示"项目不存在"和返回首页链接
    - 错误（无数据）：显示错误信息和重试按钮
    - 无数据防御：返回 null
  - 正常状态：渲染完整三栏布局 + M14b 交互组件

## M14b 新增功能

### 阶段控制
- 推进按钮：只显示在非最后阶段，点击弹出 StageAdvanceModal
- 回退按钮：只显示在非第一阶段，点击弹出 StageRollbackModal
- 操作中按钮禁用，防止重复操作
- 错误信息通过 stageError 展示

### 门禁投票
- 遍历 gateStatuses 中 pending/voting 状态的门禁
- 每个门禁渲染 GateVotingPanel 投票面板
- 投票结果通过 gateResults 记录和展示

### 异常恢复
- 页面加载时通过 `fetchRecoveryStatus` 获取活跃恢复动作
- WebSocket 收到 `recovery_action` 消息时刷新恢复状态
- 每个恢复动作渲染 RecoveryPanel 面板

### 首次引导
- 页面加载时通过 `fetchOnboardingState` 检查是否首次访问
- 首次访问自动显示 OnboardingGuide 引导
- 完成步骤通过 `completeOnboardingStep` API 记录

## UI 结构
- 顶部：ProjectHeader 项目头部
- 左侧（w-56）：StageTimeline 阶段时间线
- 中间（flex-1）：
  - 当前阶段标题 + 推进/回退按钮
  - 阶段控制错误提示
  - 恢复面板（RecoveryPanel）
  - 活动列表（ActivityList + 交互）
  - Agent 对话区（AgentChat + 流式输出）
  - 门禁状态（GateStatus + GateVotingPanel）
- 右侧（w-64）：SidebarPanel 面板
- 弹窗层：StageAdvanceModal, StageRollbackModal, OnboardingGuide

## 导出项

| 导出名称 | 说明 |
|----------|------|
| `ProjectDetailPage` (default) | 项目详情页 |
| `useProjectDetail` | 项目详情数据 Hook |
| `useProjectWS` | WebSocket 连接 Hook |
| `useAgentChat` | Agent 对话 Hook（M14b 新增） |
| `useActivityActions` | 活动操作 Hook（M14b 新增） |
| `useStageControl` | 阶段控制 Hook（M14b 新增） |

## 依赖关系
- `react-router-dom`: useParams
- `./hooks/useProjectDetail`: useProjectDetail
- `./hooks/useProjectWS`: useProjectWS
- `./hooks/useStageControl`: useStageControl
- `./components/ProjectHeader`: ProjectHeader
- `./components/StageTimeline`: StageTimeline
- `./components/ActivityList`: ActivityList
- `./components/AgentChat`: AgentChat
- `./components/GateStatus`: GateStatus
- `./components/GateVotingPanel`: GateVotingPanel
- `./components/SidebarPanel`: SidebarPanel
- `./components/StageAdvanceModal`: StageAdvanceModal
- `./components/StageRollbackModal`: StageRollbackModal
- `./components/RecoveryPanel`: RecoveryPanel
- `./components/OnboardingGuide`: OnboardingGuide
- `./types`: STAGE_LABELS, RecoveryAction, GateVoteResult
- `./api`: fetchRecoveryStatus, executeRecoveryAction, submitGateVote, fetchOnboardingState, completeOnboardingStep

## 注意事项
- 三栏使用 `overflow-hidden` 和 `overflow-y-auto` 实现独立滚动
- WebSocket 收到 `stage_changed`/`activity_changed`/`project_updated` 消息时自动刷新
- 恢复面板和引导状态通过 useEffect 在 projectId 变化时加载
- 所有弹窗和面板状态由父组件统一管理