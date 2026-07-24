/** M14a 门禁状态栏组件 */

import type { FC } from 'react';
import type { GateStatusData } from '../types';

interface GateStatusProps {
  gates: GateStatusData[];
}

const GateStatus: FC<GateStatusProps> = ({ gates }) => {
  if (gates.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500 text-sm">
        当前阶段无门禁检查
      </div>
    );
  }

  const statusIconMap: Record<string, string> = {
    passed: '✓',
    failed: '✗',
    voting: '◷',
    pending: '◻',
  };

  const statusColorMap: Record<string, string> = {
    passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
    voting: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    pending: 'bg-deep-surface text-slate-500 border-deep-border',
  };

  return (
    <div className="border border-deep-border rounded-lg bg-deep-card overflow-hidden">
      <div className="px-4 py-3 border-b border-deep-border">
        <h3 className="text-sm font-medium text-slate-200">门禁状态</h3>
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        {gates.map((gate) => {
          const colorStyle = statusColorMap[gate.status] ?? statusColorMap.pending;
          const icon = statusIconMap[gate.status] ?? statusIconMap.pending;

          return (
            <div
              key={gate.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium ${colorStyle}`}
              title={gate.description}
            >
              <span className="text-sm">{icon}</span>
              <span>{gate.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GateStatus;