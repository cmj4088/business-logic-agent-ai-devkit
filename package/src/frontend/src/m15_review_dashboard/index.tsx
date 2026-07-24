/** M15 审核仪表盘 - 入口页面 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import { useReviews, useBatchReview, useReviewHistory, useReviewIssues } from './hooks/useReviews';
import { ReviewList } from './components/ReviewList';
import { BatchReview } from './components/BatchReview';
import { ReviewHistory } from './components/ReviewHistory';
import type { VoteType } from './types';

/** 审核仪表盘主页面 */
export default function ReviewDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reviews' | 'batch' | 'history' | 'issues'>('reviews');

  const {
    reviews,
    loading,
    error,
    filters,
    updateFilter,
    refresh: refreshReviews,
  } = useReviews();

  const {
    selectedIds,
    processing: batchProcessing,
    error: batchError,
    toggleSelect,
    selectAll,
    clearSelection,
    submitBatch,
  } = useBatchReview();

  const {
    history,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useReviewHistory();

  const {
    issues,
    loading: issuesLoading,
    error: issuesError,
    severityFilter,
    statusFilter,
    setSeverityFilter,
    setStatusFilter,
    refresh: refreshIssues,
  } = useReviewIssues();

  const handleViewDetail = (reviewId: string) => {
    navigate(`/reviews/${reviewId}`);
  };

  const handleBatchSubmit = (vote: VoteType, reason: string) => {
    void submitBatch({ vote, reason: reason || undefined }).then((success) => {
      if (success) {
        refreshReviews();
      }
    });
  };

  const tabs = [
    { key: 'reviews' as const, label: '审核清单', count: reviews.length },
    { key: 'batch' as const, label: '批量审核', count: selectedIds.size },
    { key: 'history' as const, label: '审核历史', count: history.length },
    { key: 'issues' as const, label: '遗留问题', count: issues.length },
  ];

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* 页面标题 */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">审核仪表盘</h1>
          <p className="mt-1 text-sm text-slate-400">管理和审核所有 IPD 阶段的产出物</p>
        </motion.div>

        {/* 标签页切换 */}
        <div className="mb-6 flex gap-1 rounded-lg bg-deep-surface p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-deep-card text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab.key
                    ? 'bg-neon-blue/20 text-neon-blue'
                    : 'bg-deep-card text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 审核清单 */}
        {activeTab === 'reviews' && (
          <motion.div variants={itemVariants}>
            <ReviewList
              reviews={reviews}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={updateFilter}
              onRefresh={refreshReviews}
              onViewDetail={handleViewDetail}
            />
          </motion.div>
        )}

        {/* 批量审核 */}
        {activeTab === 'batch' && (
          <motion.div variants={itemVariants}>
            <BatchReview
              reviews={reviews}
              selectedIds={selectedIds}
              processing={batchProcessing}
              error={batchError}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              onSubmitBatch={handleBatchSubmit}
            />
          </motion.div>
        )}

        {/* 审核历史 */}
        {activeTab === 'history' && (
          <motion.div variants={itemVariants}>
            <ReviewHistory
              history={history}
              loading={historyLoading}
              error={historyError}
              onRefresh={refreshHistory}
              onViewDetail={handleViewDetail}
            />
          </motion.div>
        )}

        {/* 遗留问题 */}
        {activeTab === 'issues' && (
          <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-deep-border bg-deep-card shadow-sm">
            <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-200">遗留问题</h3>
              <button
                type="button"
                onClick={refreshIssues}
                disabled={issuesLoading}
                className="rounded-lg border border-deep-border px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                {issuesLoading ? '刷新中...' : '刷新'}
              </button>
            </div>

            {/* 筛选 */}
            <div className="flex flex-wrap gap-3 border-b border-deep-border/50 px-6 py-3">
              <div className="flex items-center gap-2">
                <label htmlFor="issue-severity" className="text-xs font-medium text-slate-500">严重程度</label>
                <select
                  id="issue-severity"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs text-slate-300 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                >
                  <option value="all">全部</option>
                  <option value="critical">严重</option>
                  <option value="major">重要</option>
                  <option value="minor">轻微</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="issue-status" className="text-xs font-medium text-slate-500">状态</label>
                <select
                  id="issue-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs text-slate-300 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
                >
                  <option value="all">全部</option>
                  <option value="open">未解决</option>
                  <option value="resolved">已解决</option>
                  <option value="accepted">已接受</option>
                </select>
              </div>
            </div>

            {issuesError && (
              <div className="mx-6 mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">{issuesError}</p>
              </div>
            )}

            {issuesLoading && issues.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">加载中...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-500">暂无遗留问题</p>
              </div>
            ) : (
              <div className="divide-y divide-deep-border/50">
                {issues.map((issue) => {
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
                  const statusColors: Record<string, string> = {
                    open: 'bg-red-500/10 text-red-400',
                    resolved: 'bg-green-500/10 text-green-400',
                    accepted: 'bg-deep-surface text-slate-400',
                  };

                  return (
                    <div key={issue.id} className="px-6 py-4 transition-colors hover:bg-deep-surface/80">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[issue.severity] ?? severityColors.minor}`}>
                          {issue.severity === 'critical' ? '严重' : issue.severity === 'major' ? '重要' : '轻微'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[issue.status] ?? statusColors.open}`}>
                          {statusLabels[issue.status] ?? issue.status}
                        </span>
                        {issue.projectName && (
                          <span className="text-xs text-slate-500">{issue.projectName}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{issue.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        创建于 {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                        {issue.resolvedAt && ` · 解决于 ${new Date(issue.resolvedAt).toLocaleDateString('zh-CN')}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </motion.div>
        )}
      </div>
    </AnimatedPageWrapper>
  );
}

export { ReviewDetail } from './components/ReviewDetail';
export { useReviews, useReviewDetail, useBatchReview, useReviewHistory, useReviewIssues } from './hooks/useReviews';