/** M14a 供应链小组件（容器） */

import type { FC } from 'react';

interface SupplyChainWidgetProps {
  projectId: string;
}

const SupplyChainWidget: FC<SupplyChainWidgetProps> = ({ projectId: _projectId }) => {
  return (
    <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
      <div className="px-4 py-3 border-b border-deep-border">
        <h3 className="text-sm font-medium text-slate-200">供应链</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-300">全部正常</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">供应商</span>
            <span className="text-slate-300 font-medium">--</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">物料状态</span>
            <span className="text-slate-300 font-medium">--</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">交付周期</span>
            <span className="text-slate-300 font-medium">--</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">数据加载中，将在后续版本完善</p>
      </div>
    </div>
  );
};

export default SupplyChainWidget;