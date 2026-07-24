/** M15 审核仪表盘 - 类型定义 */

import type { IPDStage, PaginatedResponse } from '@/shared/types';

/** 审核状态 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision' | 'auto_approved' | 'escalated';

/** 审核优先级 */
export type ReviewPriority = 'red' | 'yellow' | 'gray';

/** 投票类型 */
export type VoteType = 'approve' | 'reject' | 'request_changes';

/** 产出物类型 */
export type DeliverableType = 'CDCP' | 'PDCP' | 'TR3' | 'TR4' | 'TR5' | 'TR6' | 'ADCP' | 'LDCP' | 'MRD' | 'SPEC' | 'DESIGN';

/** AI 徽章 */
export interface AIBadge {
  agent: string;
  agentLabel: string;
  confidence: number;
  generatedAt: string;
}

/** 审核项 */
export interface Review {
  id: string;
  projectId: string;
  projectName: string;
  deliverableType: DeliverableType;
  deliverableName: string;
  stage: IPDStage;
  stageLabel: string;
  priority: ReviewPriority;
  status: ReviewStatus;
  industry: string;
  assignee: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  waitingHours: number;
  autoApproved: boolean;
  content?: string;
  aiBadge?: AIBadge;
  history?: ReviewHistoryEntry[];
  issues?: ReviewIssue[];
}

/** 审核历史记录 */
export interface ReviewHistoryEntry {
  id: string;
  reviewId: string;
  action: string;
  reviewer: string;
  vote?: VoteType;
  comment?: string;
  timestamp: string;
}

/** 遗留问题 */
export interface ReviewIssue {
  id: string;
  reviewId: string;
  projectId: string;
  projectName: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'resolved' | 'accepted';
  createdAt: string;
  resolvedAt?: string;
}

/** 投票请求 */
export interface VoteRequest {
  gate_id: string;
  vote: VoteType;
  comment?: string;
}

/** 批量审核请求 */
export interface BatchReviewRequest {
  reviewIds: string[];
  vote: VoteType;
  reason?: string;
}

/** 审核筛选参数 */
export interface ReviewFilters {
  project?: string;
  stage?: string;
  status?: ReviewStatus | 'all';
  priority?: ReviewPriority | 'all';
}

/** 合规规则 */
export interface ComplianceRule {
  industry: string;
  rules: string[];
}

/** 审核列表响应 */
export type ReviewListResponse = PaginatedResponse<Review>;

/** 状态标签映射 */
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  needs_revision: '需要修改',
  auto_approved: '自动通过',
  escalated: '已升级',
};

/** 状态颜色映射 */
export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
  needs_revision: 'bg-orange-100 text-orange-700 border-orange-300',
  auto_approved: 'bg-slate-100 text-slate-600 border-slate-300',
  escalated: 'bg-purple-100 text-purple-700 border-purple-300',
};

/** 优先级标签映射 */
export const REVIEW_PRIORITY_LABELS: Record<ReviewPriority, string> = {
  red: '高优先级',
  yellow: '中优先级',
  gray: '低优先级',
};

/** 优先级颜色映射 */
export const REVIEW_PRIORITY_COLORS: Record<ReviewPriority, string> = {
  red: 'bg-red-100 text-red-700 border-red-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  gray: 'bg-slate-100 text-slate-500 border-slate-300',
};

/** 优先级排序权重 */
export const REVIEW_PRIORITY_ORDER: Record<ReviewPriority, number> = {
  red: 0,
  yellow: 1,
  gray: 2,
};

/** 投票类型标签 */
export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  approve: '通过',
  reject: '驳回',
  request_changes: '需要修改',
};

/** 产出物类型标签 */
export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  CDCP: 'CDCP 评审',
  PDCP: 'PDCP 评审',
  TR3: 'TR3 评审',
  TR4: 'TR4 评审',
  TR5: 'TR5 评审',
  TR6: 'TR6 评审',
  ADCP: 'ADCP 评审',
  LDCP: 'LDCP 评审',
  MRD: 'MRD 审核',
  SPEC: '规格审核',
  DESIGN: '设计审核',
};

/** 阶段选项 */
export const STAGE_FILTERS = [
  { value: 'all', label: '全部阶段' },
  { value: 'concept', label: '概念阶段' },
  { value: 'plan', label: '规划阶段' },
  { value: 'develop', label: '开发阶段' },
  { value: 'verify', label: '验证阶段' },
  { value: 'launch', label: '发布阶段' },
  { value: 'lifecycle', label: '生命周期' },
] as const;

/** 状态筛选项 */
export const STATUS_FILTERS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'needs_revision', label: '需要修改' },
  { value: 'auto_approved', label: '自动通过' },
  { value: 'escalated', label: '已升级' },
] as const;