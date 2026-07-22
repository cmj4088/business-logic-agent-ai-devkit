/** M18 用量与设置模块 — 用量概览组件 */

import React from 'react';
import type { UsageOverview, ModelUsage } from '../types';

interface UsageOverviewProps {
  data: UsageOverview;
}

/** 格式化数字 */
function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

/** 格式化金额 */
function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** 概览卡片 */
function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-deep-card rounded-lg border border-deep-border p-4 flex flex-col gap-1">
      <span className="text-sm text-slate-500">{icon} {label}</span>
      <span className="text-2xl font-bold text-slate-100">{value}</span>
    </div>
  );
}

/** 模型分布条 */
function ModelDistributionBar({ models }: { models: ModelUsage[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">模型分布</h3>
      {models.map((m) => (
        <div key={m.model_name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">
              {m.model_label}
              {m.is_local && <span className="text-xs text-slate-500 ml-1">(本地)</span>}
            </span>
            <span className="text-slate-500">{m.percentage}% — {formatCost(m.cost)}</span>
          </div>
          <div className="w-full bg-deep-surface rounded-full h-2.5">
            <div
              className="bg-neon-blue h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${m.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const UsageOverview: React.FC<UsageOverviewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-100">用量统计</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="总 Token" value={formatNumber(data.total_tokens)} icon="📊" />
        <StatCard label="总成本" value={formatCost(data.total_cost)} icon="💰" />
        <StatCard label="调用次数" value={formatNumber(data.total_calls)} icon="📞" />
        <StatCard label="活跃项目" value={formatNumber(data.active_projects)} icon="📁" />
      </div>

      {/* 模型分布 */}
      <div className="bg-deep-card rounded-lg border border-deep-border p-4">
        <ModelDistributionBar models={data.model_distribution} />
      </div>
    </div>
  );
};

export default UsageOverview;