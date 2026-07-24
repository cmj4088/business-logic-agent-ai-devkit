/** M18 用量与设置模块 — 预算预警配置组件 */

import React, { useState, useEffect } from 'react';
import type { BudgetAlerts } from '../types';

interface BudgetAlertsProps {
  alerts: BudgetAlerts;
  onSave: (alerts: BudgetAlerts) => Promise<boolean>;
}

const BudgetAlertsComponent: React.FC<BudgetAlertsProps> = ({ alerts, onSave }) => {
  const [thresholdPercent, setThresholdPercent] = useState(alerts.threshold_percent.toString());
  const [enabled, setEnabled] = useState(alerts.enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setThresholdPercent(alerts.threshold_percent.toString());
    setEnabled(alerts.enabled);
  }, [alerts]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const newAlerts: BudgetAlerts = {
      threshold_percent: parseInt(thresholdPercent, 10) || 0,
      enabled,
    };

    const success = await onSave(newAlerts);
    if (success) {
      setMessage({ type: 'success', text: '预算预警已保存' });
    } else {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">预算预警</h2>

      <div className="rounded-xl border border-deep-border bg-deep-card p-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400">达到预算的</label>
          <input
            type="number"
            value={thresholdPercent}
            onChange={(e) => setThresholdPercent(e.target.value)}
            disabled={!enabled}
            className="w-20 px-3 py-1.5 border border-deep-border rounded-lg bg-deep-surface text-sm text-slate-200 text-center focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
            min={1}
            max={100}
          />
          <span className="text-sm text-slate-400">% 时提醒</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-deep-border bg-deep-surface text-neon-blue focus:ring-neon-blue"
            />
            <span className="text-sm text-slate-400">启用预警</span>
          </label>
        </div>

        {/* 预算进度条预览 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>预算使用率</span>
            <span>{thresholdPercent}% 预警线</span>
          </div>
          <div className="w-full bg-deep-surface rounded-full h-2 relative overflow-hidden">
            <div className="bg-neon-blue h-2 rounded-full" style={{ width: `${Math.min(Number(thresholdPercent) - 10, 70)}%` }} />
            <div
              className="absolute top-0 h-2 w-0.5 bg-red-400"
              style={{ left: `${thresholdPercent}%` }}
            />
          </div>
        </div>

        {/* 保存 */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-neon-blue/20 px-4 py-1.5 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50 transition-colors"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAlertsComponent;