/** M14a/M14b 项目详情 API 调用 */

import { get, post } from '@/shared/api-client';
import type {
  ProjectDetail,
  StageResponse,
  Activity,
  GateStatusData,
  ChatMessage,
  StageAdvanceRequest,
  StageRollbackRequest,
  GateVoteRequest,
  GateVoteResult,
  ActivityActionRequest,
  RecoveryAction,
  RecoveryStatus,
  StreamMessageEvent,
} from './types';

/** 获取项目详情 */
export async function fetchProjectDetail(id: string): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/api/projects/${id}`);
}

/** 获取当前阶段详情 */
export async function fetchStageDetail(id: string): Promise<StageResponse> {
  return get<StageResponse>(`/api/projects/${id}/stage`);
}

/** 获取当前阶段活动列表 */
export async function fetchActivities(id: string): Promise<Activity[]> {
  return get<Activity[]>(`/api/projects/${id}/activities`);
}

/** 获取门禁状态 */
export async function fetchGateStatus(id: string): Promise<GateStatusData[]> {
  return get<GateStatusData[]>(`/api/projects/${id}/gates`);
}

// ============================================================
// M14b 新增 API 函数
// ============================================================

/** 获取项目消息历史 */
export async function fetchMessages(projectId: string, stage?: string): Promise<ChatMessage[]> {
  const config = stage ? { params: { stage } } : undefined;
  return get<ChatMessage[]>(`/api/projects/${projectId}/messages`, config);
}

/** 发送用户消息 */
export async function sendMessage(projectId: string, content: string): Promise<ChatMessage> {
  return post<ChatMessage>(`/api/projects/${projectId}/messages`, { content });
}

/** 执行活动操作 */
export async function performActivityAction(
  projectId: string,
  activityId: string,
  action: ActivityActionRequest,
): Promise<Activity> {
  return post<Activity>(`/api/projects/${projectId}/activities/${activityId}/action`, action);
}

/** 推进阶段 */
export async function advanceStage(projectId: string, request: StageAdvanceRequest): Promise<StageResponse> {
  return post<StageResponse>(`/api/projects/${projectId}/advance`, request);
}

/** 回退阶段 */
export async function rollbackStage(projectId: string, request: StageRollbackRequest): Promise<StageResponse> {
  return post<StageResponse>(`/api/projects/${projectId}/rollback`, request);
}

/** 门禁投票 */
export async function submitGateVote(projectId: string, request: GateVoteRequest): Promise<GateVoteResult> {
  return post<GateVoteResult>(`/api/projects/${projectId}/gates/${request.gateId}/vote`, request);
}

/** 暂停项目 */
export async function pauseProject(projectId: string): Promise<ProjectDetail> {
  return post<ProjectDetail>(`/api/projects/${projectId}/pause`);
}

/** 恢复项目 */
export async function resumeProject(projectId: string): Promise<ProjectDetail> {
  return post<ProjectDetail>(`/api/projects/${projectId}/resume`);
}

/** 获取恢复状态 */
export async function fetchRecoveryStatus(projectId: string): Promise<RecoveryStatus> {
  return get<RecoveryStatus>(`/api/recovery/projects/${projectId}/status`);
}

/** 执行恢复动作 */
export async function executeRecoveryAction(
  projectId: string,
  actionId: string,
  resolution: string,
): Promise<RecoveryAction> {
  return post<RecoveryAction>(`/api/recovery/actions/${actionId}/execute`, {
    project_id: projectId,
    resolution,
  });
}

/** 获取引导状态 */
export async function fetchOnboardingState(): Promise<{ isFirstVisit: boolean; completedSteps: string[] }> {
  return get<{ isFirstVisit: boolean; completedSteps: string[] }>('/api/user/onboarding');
}

/** 标记引导步骤完成 */
export async function completeOnboardingStep(stepId: string): Promise<void> {
  return post<void>(`/api/user/onboarding/complete`, { step_id: stepId });
}

/** WebSocket 消息事件类型（用于 useAgentChat hook） */
export type { StreamMessageEvent };