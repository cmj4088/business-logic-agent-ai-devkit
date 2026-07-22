/** 审核历史组件 */

import type { Review } from '../types';
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS, DELIVERABLE_TYPE_LABELS } from '../types';

interface ReviewHistoryProps {
  history: Review[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewDetail: (reviewId: string) => void;
}

export function ReviewHistory({
  history,
  loading,
  error,
  onRefresh,
  onViewDetail,
}: ReviewHistoryProps) {
  return (
    <div className="rounded-xl border border-deep-border bg-deep-card shadow-sm">
      <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-200">审核历史</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-deep-border px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && history.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">暂无审核历史记录</p>
        </div>
      ) : (
        <div className="divide-y divide-deep-border/50">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-deep-surface/80"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">
                    {DELIVERABLE_TYPE_LABELS[item.deliverableType] ?? item.deliverableName}
                  </span>
                  <span className="text-xs text-slate-500">{item.projectName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{item.stageLabel}</span>
                  <span className="text-xs text-slate-600">|</span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                  {item.autoApproved && (
                    <span className="text-xs italic text-slate-500">自动通过</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${REVIEW_STATUS_COLORS[item.status]}`}
                >
                  {REVIEW_STATUS_LABELS[item.status]}
                </span>
                <button
                  type="button"
                  onClick={() => onViewDetail(item.id)}
                  className="text-sm font-medium text-neon-blue hover:text-neon-blue/80"
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}