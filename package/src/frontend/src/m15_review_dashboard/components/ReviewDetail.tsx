/** 审核详情组件 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { VoteType } from '../types';
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_COLORS, DELIVERABLE_TYPE_LABELS } from '../types';
import { useReviewDetail } from '../hooks/useReviews';
import { AutoApprovedBadge } from './AutoApprovedBadge';
import { ComplianceReminder } from './ComplianceReminder';
import { VotePanel } from './VotePanel';

/** AI 徽章显示 */
function AIBadgeDisplay({ agent, agentLabel, confidence }: { agent: string; agentLabel: string; confidence: number }) {
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
        <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-purple-400">AI 生成 — {agentLabel}</span>
        <span className="text-xs text-purple-500">Agent: {agent} · 置信度 {confidencePercent}%</span>
      </div>
    </div>
  );
}

/** 审核历史时间线 */
function HistoryTimeline({ history }: { history: { id: string; action: string; reviewer: string; comment?: string; timestamp: string }[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">暂无审核历史</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((entry, index) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-neon-blue' : 'bg-slate-600'}`} />
            {index < history.length - 1 && <div className="mt-1 h-full w-px bg-deep-border" />}
          </div>
          <div className="flex flex-col gap-0.5 pb-3">
            <span className="text-sm font-medium text-slate-200">{entry.action}</span>
            <span className="text-xs text-slate-500">
              {entry.reviewer} · {new Date(entry.timestamp).toLocaleString('zh-CN')}
            </span>
            {entry.comment && (
              <p className="mt-1 rounded bg-deep-surface px-2 py-1 text-xs text-slate-400">{entry.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 遗留问题列表 */
function IssuesList({ issues }: { issues: { id: string; description: string; severity: string; status: string }[] }) {
  if (issues.length === 0) {
    return <p className="text-sm text-slate-500">暂无遗留问题</p>;
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    major: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    minor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  const statusLabels: Record<string, string> = {
    open: '未解决',
    resolved: '已解决',
    accepted: '已接受',
  };

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div key={issue.id} className="rounded-lg border border-deep-border bg-deep-surface p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[issue.severity] ?? severityColors.minor}`}>
              {issue.severity === 'critical' ? '严重' : issue.severity === 'major' ? '重要' : '轻微'}
            </span>
            <span className="text-xs text-slate-500">{statusLabels[issue.status] ?? issue.status}</span>
          </div>
          <p className="text-sm text-slate-300">{issue.description}</p>
        </div>
      ))}
    </div>
  );
}

export function ReviewDetail() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { review, loading, error, voting, voteError, submitVote, escalate } = useReviewDetail(reviewId);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const handleVote = (vote: VoteType, reason: string) => {
    if (!review) return;
    void submitVote({
      gate_id: review.deliverableType,
      vote,
      comment: reason || undefined,
    });
  };

  const handleEscalate = () => {
    setShowEscalateConfirm(true);
  };

  const confirmEscalate = async () => {
    if (!escalateReason.trim()) return;
    const success = await escalate(escalateReason.trim());
    if (success) {
      setShowEscalateConfirm(false);
      setEscalateReason('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep-base">
        <p className="text-sm text-slate-500">加载审核详情中...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-deep-base">
        <p className="text-sm text-red-400">{error ?? '未找到审核详情'}</p>
        <button
          type="button"
          onClick={() => navigate('/reviews')}
          className="text-sm font-medium text-neon-blue hover:text-neon-blue/80"
        >
          ← 返回审核列表
        </button>
      </div>
    );
  }

  const canVote = review.status === 'pending' || review.status === 'escalated';

  return (
    <div className="min-h-screen bg-deep-base p-8">
      <div className="mx-auto max-w-4xl">
        {/* 返回按钮 */}
        <button
          type="button"
          onClick={() => navigate('/reviews')}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回审核列表
        </button>

        {/* 审核标题 */}
        <div className="mb-6 rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-xl font-bold text-slate-100">
                {DELIVERABLE_TYPE_LABELS[review.deliverableType] ?? review.deliverableName}
              </h1>
              <p className="text-sm text-slate-500">{review.projectName} · {review.stageLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              {review.autoApproved && <AutoApprovedBadge showDetail />}
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${REVIEW_STATUS_COLORS[review.status]}`}>
                {REVIEW_STATUS_LABELS[review.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <span className="text-slate-500">行业</span>
              <p className="font-medium text-slate-200">{review.industry}</p>
            </div>
            <div>
              <span className="text-slate-500">创建人</span>
              <p className="font-medium text-slate-200">{review.createdBy}</p>
            </div>
            <div>
              <span className="text-slate-500">创建时间</span>
              <p className="font-medium text-slate-200">{new Date(review.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <span className="text-slate-500">审核人</span>
              <p className="font-medium text-slate-200">{review.assignee}</p>
            </div>
          </div>
        </div>

        {/* 产出物内容 */}
        {review.content && (
          <div className="mb-6 rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">产出物内容</h2>

            {review.aiBadge && (
              <div className="mb-4">
                <AIBadgeDisplay
                  agent={review.aiBadge.agent}
                  agentLabel={review.aiBadge.agentLabel}
                  confidence={review.aiBadge.confidence}
                />
              </div>
            )}

            <div className="prose prose-sm max-w-none rounded-lg border border-deep-border bg-deep-surface p-4">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{review.content}</pre>
            </div>
          </div>
        )}

        {/* 合规提醒 */}
        <div className="mb-6">
          <ComplianceReminder industry={review.industry} />
        </div>

        {/* 投票面板 */}
        {canVote && (
          <div className="mb-6">
            <VotePanel
              voting={voting}
              voteError={voteError}
              onSubmitVote={handleVote}
              onEscalate={handleEscalate}
            />
          </div>
        )}

        {/* 审核升级弹窗 */}
        {showEscalateConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="mx-4 w-full max-w-md rounded-xl border border-deep-border bg-deep-card p-6 shadow-xl">
              <h4 className="mb-2 text-lg font-semibold text-slate-100">审核升级</h4>
              <p className="mb-4 text-sm text-slate-500">将此审核升级至上级处理。请填写升级原因：</p>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="请描述升级原因，如门禁失败、技术争议等..."
                rows={3}
                className="mb-4 w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEscalateConfirm(false); setEscalateReason(''); }}
                  className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-400 hover:bg-deep-border"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void confirmEscalate()}
                  disabled={!escalateReason.trim() || voting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {voting ? '处理中...' : '确认升级'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 已审核状态提示 */}
        {!canVote && review.status !== 'auto_approved' && (
          <div className="mb-6 rounded-lg border border-deep-border bg-deep-surface p-4">
            <p className="text-sm text-slate-500">此审核已处理，状态：{REVIEW_STATUS_LABELS[review.status]}</p>
          </div>
        )}

        {/* 审核历史 */}
        {review.history && review.history.length > 0 && (
          <div className="mb-6 rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">审核历史</h2>
            <HistoryTimeline history={review.history} />
          </div>
        )}

        {/* 遗留问题 */}
        {review.issues && review.issues.length > 0 && (
          <div className="mb-6 rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">遗留问题</h2>
            <IssuesList issues={review.issues} />
          </div>
        )}
      </div>
    </div>
  );
}