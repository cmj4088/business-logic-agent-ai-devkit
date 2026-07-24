/** M18 用量与设置模块 — 项目用量明细组件 */

import React from 'react';
import type { ProjectUsageItem } from '../types';

interface ProjectUsageProps {
  projects: ProjectUsageItem[];
}

/** 格式化数字 */
function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

/** 格式化金额 */
function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

const ProjectUsage: React.FC<ProjectUsageProps> = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="bg-deep-card rounded-lg border border-deep-border p-6 text-center text-slate-500">
        暂无项目用量数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">项目用量</h2>

      <div className="bg-deep-card rounded-lg border border-deep-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-deep-surface border-b border-deep-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">项目名称</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Token 消耗</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">调用次数</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">成本</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.project_id} className="border-b border-deep-border hover:bg-deep-surface transition-colors">
                <td className="px-4 py-3 text-sm text-slate-200 font-medium">{p.project_name}</td>
                <td className="px-4 py-3 text-sm text-slate-400 text-right">{formatNumber(p.total_tokens)}</td>
                <td className="px-4 py-3 text-sm text-slate-400 text-right">{formatNumber(p.call_count)}</td>
                <td className="px-4 py-3 text-sm text-slate-400 text-right">{formatCost(p.total_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectUsage;