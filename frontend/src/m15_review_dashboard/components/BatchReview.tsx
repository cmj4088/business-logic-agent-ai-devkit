/** 批量审核组件 */

import { useState } from 'react';
import type { VoteType, Review } from '../types';
import { VOTE_TYPE_LABELS } from '../types';

interface BatchReviewProps {
  reviews: Review[];
  selectedIds: Set<string>;
  processing: boolean;
  error: string | null;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearSelection: () => void;
  onSubmitBatch: (vote: VoteType, reason: string) => void;
}

export function BatchReview({
  reviews,
  selectedIds,
  processing,
  error,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onSubmitBatch,
}: BatchReviewProps) {
  const [batchVote, setBatchVote] = useState<VoteType>('approve');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const needsReason = batchVote === 'reject' || batchVote === 'request_changes';
  const canSubmit = selectedIds.size > 0 && (!needsReason || reason.trim().length > 0);

  const batchableReviews = reviews.filter((r) => r.status === 'pending');

  const handleSelectAll = () => {
    if (selectedIds.size === batchableReviews.length) {
      onClearSelection();
    } else {
      onSelectAll(batchableReviews.map((r) => r.id));
    }
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    onSubmitBatch(batchVote, reason.trim());
    setShowConfirm(false);
    setReason('');
  };

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">批量审核</h3>
        <span className="text-xs text-slate-500">
          已选 {selectedIds.size} / {batchableReviews.length} 项
        </span>
      </div>

      {/* 全选 */}
      {batchableReviews.length > 0 && (
        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={selectedIds.size === batchableReviews.length && batchableReviews.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-slate-500 text-neon-blue focus:ring-neon-blue bg-deep-surface"
            />
            全选待审核项
          </label>
        </div>
      )}

      {/* 审核项列表 */}
      {batchableReviews.length > 0 ? (
        <div className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-deep-border p-2">
          {batchableReviews.map((review) => (
            <label
              key={review.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-deep-surface"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(review.id)}
                onChange={() => onToggleSelect(review.id)}
                className="h-4 w-4 rounded border-slate-500 text-neon-blue focus:ring-neon-blue bg-deep-surface"
              />
              <span className="text-slate-300">{review.projectName}</span>
              <span className="text-xs text-slate-500">— {review.deliverableName}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">暂无待审核项</p>
      )}

      {/* 批量投票类型 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-400">批量操作</label>
        <div className="flex gap-2">
          {(['approve', 'reject', 'request_changes'] as VoteType[]).map((vote) => {
            const isSelected = batchVote === vote;
            const colorClasses = vote === 'approve'
              ? isSelected ? 'bg-green-600 text-white' : 'border-green-500/30 text-green-500 hover:bg-green-500/10'
              : vote === 'reject'
                ? isSelected ? 'bg-red-600 text-white' : 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                : isSelected ? 'bg-orange-600 text-white' : 'border-orange-500/30 text-orange-500 hover:bg-orange-500/10';

            return (
              <button
                key={vote}
                type="button"
                onClick={() => setBatchVote(vote)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${colorClasses}`}
              >
                {VOTE_TYPE_LABELS[vote]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 理由输入 */}
      {needsReason && (
        <div className="mb-4">
          <label htmlFor="batch-reason" className="mb-1 block text-sm font-medium text-slate-400">
            {batchVote === 'reject' ? '驳回理由' : '修改要求'} <span className="text-red-400">*</span>
          </label>
          <textarea
            id="batch-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请填写批量操作的理由..."
            rows={2}
            className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-deep-border bg-deep-card p-6 shadow-xl">
            <h4 className="mb-2 text-lg font-semibold text-slate-100">确认批量操作</h4>
            <p className="mb-1 text-sm text-slate-500">
              将对 <span className="font-semibold text-slate-300">{selectedIds.size}</span> 项审核执行
              <span className="font-semibold text-slate-300"> {VOTE_TYPE_LABELS[batchVote]}</span> 操作
            </p>
            {needsReason && (
              <p className="mb-4 text-sm text-slate-500">理由：{reason}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-400 hover:bg-deep-border"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processing}
                className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量提交按钮 */}
      <button
        type="button"
        disabled={!canSubmit || processing}
        onClick={() => setShowConfirm(true)}
        className="w-full rounded-lg bg-neon-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? '批量处理中...' : `批量${VOTE_TYPE_LABELS[batchVote]} (${selectedIds.size})`}
      </button>
    </div>
  );
}