/** M14a 竞品小组件（容器） */

import type { FC } from 'react';

interface CompetitorWidgetProps {
  projectId: string;
}

const CompetitorWidget: FC<CompetitorWidgetProps> = ({ projectId: _projectId }) => {
  return (
    <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
      <div className="px-4 py-3 border-b border-deep-border">
        <h3 className="text-sm font-medium text-slate-200">竞品动态</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl text-slate-600 mb-2">--</span>
          <p className="text-xs text-slate-500">暂无数据</p>
          <p className="text-xs text-slate-600 mt-1">竞品信息将在后续版本完善</p>
        </div>
      </div>
    </div>
  );
};

export default CompetitorWidget;