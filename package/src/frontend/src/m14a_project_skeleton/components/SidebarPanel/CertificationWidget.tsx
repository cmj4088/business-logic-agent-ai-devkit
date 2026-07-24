/** M14a 认证小组件（容器） */

import type { FC } from 'react';

interface CertificationWidgetProps {
  projectId: string;
}

const CertificationWidget: FC<CertificationWidgetProps> = ({ projectId: _projectId }) => {
  return (
    <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
      <div className="px-4 py-3 border-b border-deep-border">
        <h3 className="text-sm font-medium text-slate-200">认证进度</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-3">
          <span className="text-2xl text-slate-600 mb-2">--</span>
          <p className="text-xs text-slate-500">不适用</p>
          <p className="text-xs text-slate-600 mt-1">当前项目无需认证</p>
        </div>
      </div>
    </div>
  );
};

export default CertificationWidget;