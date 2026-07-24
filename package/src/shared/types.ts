/**
 * Business Logic Agent 前端共享类型定义。
 *
 * 包含 IPD 阶段、Agent 角色、编排模式、复杂度级别等类型，
 * 以及 API 响应、用户、项目、产物等数据模型。
 */

export type IPDStage = 'concept' | 'plan' | 'develop' | 'verify' | 'launch' | 'lifecycle';

export type AgentRole = 'product_manager' | 'rd' | 'qa' | 'marketing' | 'manufacturing' | 'finance';

export type OrchestrationMode = 'parallel' | 'sequential' | 'debate';

export type ComplexityTier = 'auto' | 'lite' | 'standard' | 'full';

/** 统一 API 响应结构 */
export interface ApiResponse<T> {
  data: T;
  error: null | { code: string; message: string };
  meta: {
    request_id: string;
    page?: number;
    page_size?: number;
    total?: number;
  };
}

/** 用户信息 */
export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

/** 项目信息 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  complexity_tier: ComplexityTier;
  current_stage: IPDStage;
  status: 'active' | 'paused' | 'completed' | 'archived';
  progress: number;
  template_id: string;
  budget_limit: number;
  team_size: number;
  target_weeks: number;
  industry: string;
  created_at: string;
  updated_at: string;
}

/** AI 生成的产物信息 */
export interface Artifact {
  id: string;
  project_id: string;
  artifact_type: string;
  name: string;
  content: string;
  version: number;
  stage: IPDStage;
  ai_metadata: AIBadgeData;
  created_at: string;
  updated_at: string;
}

/** AI 徽章数据，标识 AI 生成内容的可信度 */
export interface AIBadgeData {
  ai_generated: boolean;
  generated_by: AgentRole[];
  generation_mode: OrchestrationMode;
  confidence_level: 'green' | 'yellow' | 'red';
  verified_facts: number;
  speculations: number;
}

/** 评审任务 */
export interface ReviewTask {
  id: string;
  project_id: string;
  project_name: string;
  gate_id: string;
  artifact_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  auto_approved: boolean;
  created_at: string;
}

/** 用量记录 */
export interface UsageRecord {
  id: string;
  project_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

/** 仪表盘数据 */
export interface DashboardData {
  user: User;
  pending_tasks: ReviewTask[];
  recent_auto_completed: { description: string; project_name: string; timestamp: string }[];
  projects: Project[];
  notifications: { id: string; type: string; message: string; timestamp: string }[];
}

/** WebSocket 消息类型 */
export type WebSocketMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'agent_token'
  | 'stage_update'
  | 'widget_update'
  | 'notification'
  | 'error'
  | 'ping'
  | 'pong';

/** WebSocket 消息结构 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  channel?: string;
  project_id?: string;
  data?: unknown;
}