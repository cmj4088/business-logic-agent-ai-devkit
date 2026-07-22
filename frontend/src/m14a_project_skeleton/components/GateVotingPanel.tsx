/** M14b GateVotingPanel — 门禁投票面板 */

import type { FC } from 'react';
import { useState } from 'react';
import type { GateStatusData, GateVoteResult } from '../types';

interface GateVotingPanelProps {
  gate: GateStatusData;
  gateResult: GateVoteResult | null;
  isVoting: boolean;
  onVote: (gateId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) => void;
}

/** 门禁状态颜色 */
const GATE_STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  pending: { bg: 'bg-deep-surface', border: 'border-deep-border', text: 'text-slate-300', dot: 'bg-slate-500' },
  voting: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  passed: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
};

const GateVotingPanel: FC<GateVotingPanelProps> = ({
  gate,
  gateResult,
  isVoting,
  onVote,
}) => {
  const [comment, setComment] = useState('');
  const styles = GATE_STATUS_STYLES[gate.status] ?? GATE_STATUS_STYLES.pending;
  const canVote = gate.status === 'pending' || gate.status === 'voting';

  const handleVote = (vote: 'approve' | 'reject' | 'abstain') => {
    onVote(gate.name, vote, comment || undefined);
    setComment('');
  };

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} />
          <h4 className={`text-sm font-semibold ${styles.text}`}>{gate.label}</h4>
        </div>
        <span className={`text-xs ${styles.text}`}>
          {gate.status === 'pending' && '待投票'}
          {gate.status === 'voting' && '投票中'}
          {gate.status === 'passed' && '已通过'}
          {gate.status === 'failed' && '未通过'}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">{gate.description}</p>

      {/* 投票结果 */}
      {gateResult && gateResult.votes.length > 0 && (
        <div className="mb-3 rounded-md bg-deep-card/60 p-2">
          <p className="text-xs font-medium text-slate-300 mb-1">投票记录：</p>
          {gateResult.votes.map((v, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{v.voter}</span>
              <span
                className={
                  v.vote === 'approve'
                    ? 'text-emerald-400'
                    : v.vote === 'reject'
                      ? 'text-red-400'
                      : 'text-slate-500'
                }
              >
                {v.vote === 'approve' ? '✓ 通过' : v.vote === 'reject' ? '✗ 驳回' : '— 弃权'}
              </span>
            </div>
          ))}
          {gateResult.autoApproved && (
            <p className="mt-1 text-xs text-amber-400">⚠️ 自动通过（单人模式）</p>
          )}
        </div>
      )}

      {/* 投票按钮 */}
      {canVote && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="投票备注（可选）..."
            rows={2}
            className="w-full rounded-md border border-deep-border bg-deep-card px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVote('approve')}
              disabled={isVoting}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              通过
            </button>
            <button
              type="button"
              onClick={() => handleVote('reject')}
              disabled={isVoting}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              驳回
            </button>
            <button
              type="button"
              onClick={() => handleVote('abstain')}
              disabled={isVoting}
              className="flex-1 rounded-lg border border-deep-border bg-deep-card px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-deep-surface focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              弃权
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GateVotingPanel;