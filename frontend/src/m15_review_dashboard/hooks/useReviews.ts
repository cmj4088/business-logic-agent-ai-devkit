/** M15 审核仪表盘 - 审核数据 Hook */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  Review,
  ReviewFilters,
  ReviewIssue,
  VoteRequest,
  BatchReviewRequest,
  ReviewStatus,
  ReviewPriority,
} from '../types';
import { REVIEW_PRIORITY_ORDER } from '../types';
import {
  fetchReviewsAPI,
  fetchReviewDetailAPI,
  submitVoteAPI,
  batchReviewAPI,
  fetchReviewHistoryAPI,
  fetchReviewIssuesAPI,
  escalateReviewAPI,
} from '../api';

/** 审核列表 Hook */
export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({});

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchReviewsAPI(filters);
      const sorted = [...response.items].sort(
        (a, b) => REVIEW_PRIORITY_ORDER[a.priority] - REVIEW_PRIORITY_ORDER[b.priority],
      );
      setReviews(sorted);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载审核列表失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const updateFilter = useCallback(
    <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (filters.status && filters.status !== 'all' && review.status !== filters.status) {
        return false;
      }
      if (filters.priority && filters.priority !== 'all' && review.priority !== filters.priority) {
        return false;
      }
      return true;
    });
  }, [reviews, filters]);

  return {
    reviews: filteredReviews,
    allReviews: reviews,
    loading,
    error,
    filters,
    updateFilter,
    refresh: loadReviews,
  };
}

/** 审核详情 Hook */
export function useReviewDetail(reviewId: string | undefined) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewDetailAPI(reviewId);
      setReview(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载审核详情失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const submitVote = useCallback(
    async (voteData: VoteRequest): Promise<boolean> => {
      if (!reviewId) return false;
      setVoting(true);
      setVoteError(null);
      try {
        const updated = await submitVoteAPI(reviewId, voteData);
        setReview(updated);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '投票提交失败';
        setVoteError(message);
        return false;
      } finally {
        setVoting(false);
      }
    },
    [reviewId],
  );

  const escalate = useCallback(
    async (reason: string): Promise<boolean> => {
      if (!reviewId) return false;
      setVoting(true);
      setVoteError(null);
      try {
        const updated = await escalateReviewAPI(reviewId, reason);
        setReview(updated);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '审核升级失败';
        setVoteError(message);
        return false;
      } finally {
        setVoting(false);
      }
    },
    [reviewId],
  );

  return {
    review,
    loading,
    error,
    voting,
    voteError,
    submitVote,
    escalate,
    refresh: loadDetail,
  };
}

/** 批量审核 Hook */
export function useBatchReview() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const submitBatch = useCallback(
    async (data: Omit<BatchReviewRequest, 'reviewIds'>): Promise<boolean> => {
      if (selectedIds.size === 0) {
        setError('请至少选择一项审核');
        return false;
      }
      setProcessing(true);
      setError(null);
      try {
        await batchReviewAPI({ reviewIds: Array.from(selectedIds), ...data });
        setSelectedIds(new Set());
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '批量审核失败';
        setError(message);
        return false;
      } finally {
        setProcessing(false);
      }
    },
    [selectedIds],
  );

  return {
    selectedIds,
    processing,
    error,
    toggleSelect,
    selectAll,
    clearSelection,
    submitBatch,
  };
}

/** 审核历史 Hook */
export function useReviewHistory() {
  const [history, setHistory] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewHistoryAPI();
      setHistory(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载审核历史失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return { history, loading, error, refresh: loadHistory };
}

/** 遗留问题 Hook */
export function useReviewIssues() {
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewIssuesAPI();
      setIssues(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载遗留问题失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
      return true;
    });
  }, [issues, severityFilter, statusFilter]);

  return {
    issues: filteredIssues,
    allIssues: issues,
    loading,
    error,
    severityFilter,
    statusFilter,
    setSeverityFilter,
    setStatusFilter,
    refresh: loadIssues,
  };
}

// 为了类型检查，导出未使用的类型
export type {
  Review,
  ReviewFilters,
  ReviewIssue,
  VoteRequest,
  BatchReviewRequest,
  ReviewStatus,
  ReviewPriority,
};