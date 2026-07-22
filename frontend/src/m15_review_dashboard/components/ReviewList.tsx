/** 审核列表组件 */

import type { Review, ReviewFilters } from '../types';
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
  DELIVERABLE_TYPE_LABELS,
  STAGE_FILTERS,
  STATUS_FILTERS,
} from '../types';
import { AutoApprovedBadge } from './AutoApprovedBadge';

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  filters: ReviewFilters;
  onFilterChange: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  onRefresh: () => void;
  onViewDetail: (reviewId: string) => void;
}

/** 优先级指示器 */
function PriorityIndicator({ priority }: { priority: Review['priority'] }) {
  const colors = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-slate-500',
  };
  const labels = {
    red: '高优先级',
    yellow: '中优先级',
    gray: '低优先级',
  };

  return (
    <span className="flex items-center gap-1.5 text-xs" title={labels[priority]}>
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[priority]}`} />
      {labels[priority]}
    </span>
  );
}

/** 等待时间显示 */
function WaitingTime({ hours }: { hours: number }) {
  if (hours < 1) return <span className="text-xs text-slate-500">刚刚提交</span>;
  if (hours < 24) return <span className="text-xs text-orange-400">已等待 {hours} 小时</span>;
  const days = Math.floor(hours / 24);
  return <span className="text-xs text-red-400">已等待 {days} 天</span>;
}

export function ReviewList({
  reviews,
  loading,
  error,
  filters,
  onFilterChange,
  onRefresh,
  onViewDetail,
}: ReviewListProps) {
  return (
    <div className="rounded-xl border border-deep-border bg-deep-card shadow-sm">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-100">审核清单</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-deep-border px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 border-b border-deep-border/50 px-6 py-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-stage" className="text-xs font-medium text-slate-500">阶段</label>
          <select
            id="filter-stage"
            value={filters.stage ?? 'all'}
            onChange={(e) => onFilterChange('stage', e.target.value)}
            className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs text-slate-300 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          >
            {STAGE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-status" className="text-xs font-medium text-slate-500">状态</label>
          <select
            id="filter-status"
            value={filters.status ?? 'all'}
            onChange={(e) => onFilterChange('status', e.target.value as ReviewFilters['status'])}
            className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs text-slate-300 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 列表 */}
      {loading && reviews.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">暂无审核事项</p>
        </div>
      ) : (
        <div className="divide-y divide-deep-border/50">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-deep-surface/80"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <PriorityIndicator priority={review.priority} />
                  <span className="text-sm font-medium text-slate-200">
                    {DELIVERABLE_TYPE_LABELS[review.deliverableType] ?? review.deliverableName}
                  </span>
                  <span className="text-xs text-slate-500">— {review.projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{review.stageLabel}</span>
                  {review.status === 'pending' && (
                    <>
                      <span className="text-xs text-slate-600">|</span>
                      <WaitingTime hours={review.waitingHours} />
                    </>
                  )}
                  {review.autoApproved && (
                    <>
                      <span className="text-xs text-slate-600">|</span>
                      <AutoApprovedBadge showDetail />
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${REVIEW_STATUS_COLORS[review.status]}`}
                >
                  {REVIEW_STATUS_LABELS[review.status]}
                </span>
                {review.status === 'pending' || review.status === 'escalated' ? (
                  <button
                    type="button"
                    onClick={() => onViewDetail(review.id)}
                    className="rounded-lg bg-neon-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1"
                  >
                    去审核 →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onViewDetail(review.id)}
                    className="text-sm font-medium text-neon-blue hover:text-neon-blue/80"
                  >
                    查看详情
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}