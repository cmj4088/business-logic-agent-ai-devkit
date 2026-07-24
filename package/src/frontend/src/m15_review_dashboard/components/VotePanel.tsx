/** 投票面板组件 */

import { useState } from 'react';
import type { VoteType } from '../types';
import { VOTE_TYPE_LABELS } from '../types';

interface VotePanelProps {
  voting: boolean;
  voteError: string | null;
  onSubmitVote: (vote: VoteType, reason: string) => void;
  onEscalate: () => void;
  disabled?: boolean;
}

export function VotePanel({
  voting,
  voteError,
  onSubmitVote,
  onEscalate,
  disabled = false,
}: VotePanelProps) {
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const needsReason = selectedVote === 'reject' || selectedVote === 'request_changes';
  const canSubmit = selectedVote !== null && (!needsReason || reason.trim().length > 0);

  const handleVoteClick = (vote: VoteType) => {
    setSelectedVote(vote);
    if (vote === 'approve') {
      setReason('');
    }
  };

  const handleConfirm = () => {
    if (!canSubmit || !selectedVote) return;
    onSubmitVote(selectedVote, reason.trim());
    setShowConfirm(false);
    setSelectedVote(null);
    setReason('');
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedVote(null);
    setReason('');
  };

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">审核投票</h3>

      {/* 投票按钮 */}
      <div className="mb-4 flex gap-3">
        {(['approve', 'reject', 'request_changes'] as VoteType[]).map((vote) => {
          const isSelected = selectedVote === vote;
          const baseClasses = 'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
          const colorClasses = vote === 'approve'
            ? isSelected
              ? 'border-green-500 bg-green-500/10 text-green-400 ring-2 ring-green-500'
              : 'border-green-500/30 text-green-500 hover:bg-green-500/10'
            : vote === 'reject'
              ? isSelected
                ? 'border-red-500 bg-red-500/10 text-red-400 ring-2 ring-red-500'
                : 'border-red-500/30 text-red-500 hover:bg-red-500/10'
              : isSelected
                ? 'border-orange-500 bg-orange-500/10 text-orange-400 ring-2 ring-orange-500'
                : 'border-orange-500/30 text-orange-500 hover:bg-orange-500/10';

          return (
            <button
              key={vote}
              type="button"
              disabled={disabled || voting}
              onClick={() => handleVoteClick(vote)}
              className={`${baseClasses} ${colorClasses} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {VOTE_TYPE_LABELS[vote]}
            </button>
          );
        })}
      </div>

      {/* 驳回/需要修改的理由输入 */}
      {needsReason && (
        <div className="mb-4">
          <label htmlFor="vote-reason" className="mb-1 block text-sm font-medium text-slate-400">
            {selectedVote === 'reject' ? '驳回理由' : '修改要求'} <span className="text-red-400">*</span>
          </label>
          <textarea
            id="vote-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={selectedVote === 'reject' ? '请填写驳回的具体理由...' : '请填写需要修改的具体内容...'}
            rows={3}
            className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
        </div>
      )}

      {/* 错误提示 */}
      {voteError && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{voteError}</p>
        </div>
      )}

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-xl border border-deep-border bg-deep-card p-6 shadow-xl">
            <h4 className="mb-2 text-lg font-semibold text-slate-100">确认操作</h4>
            <p className="mb-4 text-sm text-slate-500">
              {selectedVote === 'approve'
                ? '确认通过此审核？'
                : selectedVote === 'reject'
                  ? '确认驳回此审核？驳回后需要重新提交。'
                  : '确认要求修改？修改完成后需要重新审核。'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-400 hover:bg-deep-border"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={voting}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedVote === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : selectedVote === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                }`}
              >
                {voting ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!canSubmit || disabled || voting}
          onClick={() => setShowConfirm(true)}
          className="flex-1 rounded-lg bg-neon-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {voting ? '提交中...' : '提交投票'}
        </button>
        <button
          type="button"
          disabled={disabled || voting}
          onClick={onEscalate}
          className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          审核升级
        </button>
      </div>
    </div>
  );
}