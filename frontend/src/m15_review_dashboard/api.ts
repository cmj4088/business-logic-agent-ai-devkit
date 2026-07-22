/** M15 审核仪表盘 - API 调用 */

import { get, post } from '@/shared/api-client';
import type {
  Review,
  ReviewListResponse,
  ReviewIssue,
  VoteRequest,
  BatchReviewRequest,
  ReviewFilters,
} from './types';

/** 获取审核列表 */
export async function fetchReviewsAPI(filters: ReviewFilters = {}): Promise<ReviewListResponse> {
  const params = new URLSearchParams();
  if (filters.project) params.set('project', filters.project);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  const query = params.toString();
  return get<ReviewListResponse>(`/api/reviews${query ? `?${query}` : ''}`);
}

/** 获取审核详情 */
export async function fetchReviewDetailAPI(reviewId: string): Promise<Review> {
  return get<Review>(`/api/reviews/${reviewId}`);
}

/** 提交投票 */
export async function submitVoteAPI(reviewId: string, data: VoteRequest): Promise<Review> {
  return post<Review>(`/api/reviews/${reviewId}/vote`, data);
}

/** 批量审核 */
export async function batchReviewAPI(data: BatchReviewRequest): Promise<Review[]> {
  return post<Review[]>('/api/reviews/batch', data);
}

/** 获取审核历史 */
export async function fetchReviewHistoryAPI(): Promise<Review[]> {
  const data = await get<{ items: Review[]; total: number }>('/api/reviews/history');
  return data.items ?? [];
}

/** 获取遗留问题 */
export async function fetchReviewIssuesAPI(): Promise<ReviewIssue[]> {
  const data = await get<{ items: ReviewIssue[]; total: number }>('/api/reviews/issues');
  return data.items ?? [];
}

/** 审核升级 */
export async function escalateReviewAPI(reviewId: string, reason: string): Promise<Review> {
  return post<Review>(`/api/reviews/${reviewId}/escalate`, { reason });
}