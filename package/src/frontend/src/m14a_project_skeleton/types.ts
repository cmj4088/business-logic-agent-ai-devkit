/** M14a 项目详情页类型定义 */

import type { IPDStage, ComplexityTier, AgentRole } from '@/shared/types';

/** 项目状态 */
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

/** 项目详情（扩展 Project） */
export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  complexity: ComplexityTier;
  currentStage: IPDStage;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  industry: string;
  targetWeeks: number;
  teamSize: number;
  budgetLimit: number;
}

/** 阶段详情 */
export interface StageDetail {
  stage: IPDStage;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  startedAt: string | null;
  completedAt: string | null;
}

/** 活动状态 */
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** 活动项 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  status: ActivityStatus;
  isSkippable: boolean;
  assignee: string | null;
  deadline: string | null;
}

/** 门禁状态 */
export interface GateStatusData {
  name: string;
  label: string;
  stage: IPDStage;
  status: 'pending' | 'voting' | 'passed' | 'failed';
  description: string;
}

/** 当前阶段响应 */
export interface StageResponse {
  currentStage: StageDetail;
  allStages: StageDetail[];
}

/** 阶段标签映射 */
export const STAGE_LABELS: Record<IPDStage, string> = {
  concept: '概念',
  plan: '计划',
  develop: '开发',
  verify: '验证',
  launch: '发布',
  lifecycle: '生命周期',
};

/** 阶段描述映射 */
export const STAGE_DESCRIPTIONS: Record<IPDStage, string> = {
  concept: '市场分析、客户需求调研、产品概念定义',
  plan: '制定产品规格、项目计划、资源分配',
  develop: '产品设计、原型开发、技术实现',
  verify: '测试验证、质量保障、合规审查',
  launch: '产品发布、市场推广、供应链准备',
  lifecycle: '产品运维、客户支持、持续改进',
};

/** 活动状态标签 */
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  skipped: '已跳过',
};

/** 项目状态标签 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档',
};

// ============================================================
// M14b 新增类型
// ============================================================

/** 消息发送者类型 */
export type MessageSender = 'human' | AgentRole;

/** 消息类型 */
export type MessageType = 'task_proposal' | 'review' | 'handoff' | 'query' | 'response' | 'system';

/** 单条消息 */
export interface ChatMessage {
  id: string;
  projectId: string;
  sender: MessageSender;
  senderLabel: string;
  recipient?: string;
  messageType: MessageType;
  content: string;
  parentId?: string;
  roundId?: string;
  stage: string;
  metadataJson?: string;
  createdAt: string;
}

/** 推理摘要 */
export interface ReasoningSummary {
  participants: string[];
  roundCount: number;
  consensus: string;
  logicChain: string[];
  dissentingOpinion?: string;
}

/** 流式消息事件 */
export interface StreamMessageEvent {
  type: 'token' | 'done' | 'error' | 'summary';
  agentRole?: AgentRole;
  content?: string;
  summary?: ReasoningSummary;
  error?: string;
}

/** 活动操作类型 */
export type ActivityAction = 'start' | 'skip' | 'complete' | 'bypass';

/** 活动操作请求 */
export interface ActivityActionRequest {
  action: ActivityAction;
  humanInput?: string;
  bypassOption?: 'skip_once' | 'auto_until_error' | 'let_agent_decide';
}

/** 阶段推进请求 */
export interface StageAdvanceRequest {
  targetStage: IPDStage;
  confirm: boolean;
}

/** 阶段回退请求 */
export interface StageRollbackRequest {
  targetStage: IPDStage;
  reason: string;
}

/** 门禁投票请求 */
export interface GateVoteRequest {
  gateId: string;
  vote: 'approve' | 'reject' | 'abstain';
  comment?: string;
}

/** 门禁投票结果 */
export interface GateVoteResult {
  gateId: string;
  status: 'pending' | 'voting' | 'passed' | 'failed';
  votes: Array<{
    voter: string;
    vote: string;
    comment?: string;
  }>;
  autoApproved: boolean;
}

/** 恢复动作类型 */
export type RecoveryActionType = 'regenerate' | 'switch_model' | 'moderator_decide' | 'restart_debate' | 'proceed_with_issues';

/** 恢复动作 */
export interface RecoveryAction {
  id: string;
  type: RecoveryActionType;
  title: string;
  description: string;
  options: Array<{
    label: string;
    action: string;
    type: 'primary' | 'secondary' | 'link';
  }>;
}

/** 恢复状态 */
export interface RecoveryStatus {
  hasActiveActions: boolean;
  activeActions: RecoveryAction[];
  projectHealth: 'healthy' | 'degraded' | 'blocked';
}

/** 引导步骤 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

/** 引导状态 */
export interface OnboardingState {
  isFirstVisit: boolean;
  completedSteps: string[];
  currentStep: number;
}