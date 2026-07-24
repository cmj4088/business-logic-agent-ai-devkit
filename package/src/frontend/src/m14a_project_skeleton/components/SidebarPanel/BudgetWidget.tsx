/** M14a 预算小组件（容器） */

import type { FC } from 'react';

interface BudgetWidgetProps {
  projectId: string;
}

const BudgetWidget: FC<BudgetWidgetProps> = ({ projectId: _projectId }) => {
  return (
    <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
      <div className="px-4 py-3 border-b border-deep-border">
        <h3 className="text-sm font-medium text-slate-200">预算健康度</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-300">偏差</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">5%</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>已使用</span>
            <span>预算</span>
          </div>
          <div className="w-full h-2 bg-deep-surface rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">预算健康，偏差在可控范围内</p>
      </div>
    </div>
  );
};

export default BudgetWidget;