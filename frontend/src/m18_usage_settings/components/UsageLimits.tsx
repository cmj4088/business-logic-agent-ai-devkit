/** M18 用量与设置模块 — 用量限制配置组件 */

import React, { useState, useEffect } from 'react';
import type { UsageLimits } from '../types';

interface UsageLimitsProps {
  limits: UsageLimits;
  onSave: (limits: UsageLimits) => Promise<boolean>;
}

const UsageLimitsComponent: React.FC<UsageLimitsProps> = ({ limits, onSave }) => {
  const [dailyLimit, setDailyLimit] = useState(limits.daily_limit.toString());
  const [monthlyLimit, setMonthlyLimit] = useState(limits.monthly_limit.toString());
  const [dailyEnabled, setDailyEnabled] = useState(limits.daily_enabled);
  const [monthlyEnabled, setMonthlyEnabled] = useState(limits.monthly_enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDailyLimit(limits.daily_limit.toString());
    setMonthlyLimit(limits.monthly_limit.toString());
    setDailyEnabled(limits.daily_enabled);
    setMonthlyEnabled(limits.monthly_enabled);
  }, [limits]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const newLimits: UsageLimits = {
      daily_limit: parseInt(dailyLimit, 10) || 0,
      monthly_limit: parseInt(monthlyLimit, 10) || 0,
      daily_enabled: dailyEnabled,
      monthly_enabled: monthlyEnabled,
    };

    const success = await onSave(newLimits);
    if (success) {
      setMessage({ type: 'success', text: '用量限制已保存' });
    } else {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">用量限制</h2>

      <div className="rounded-xl border border-deep-border bg-deep-card p-4 space-y-4">
        {/* 每日上限 */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400 w-24">每日上限</label>
          <input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            disabled={!dailyEnabled}
            className="w-36 px-3 py-1.5 border border-deep-border rounded-lg bg-deep-surface text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
            min={0}
          />
          <span className="text-sm text-slate-500">tokens</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dailyEnabled}
              onChange={(e) => setDailyEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-deep-border bg-deep-surface text-neon-blue focus:ring-neon-blue"
            />
            <span className="text-sm text-slate-400">启用</span>
          </label>
        </div>

        {/* 每月上限 */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400 w-24">每月上限</label>
          <input
            type="number"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            disabled={!monthlyEnabled}
            className="w-36 px-3 py-1.5 border border-deep-border rounded-lg bg-deep-surface text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50 disabled:cursor-not-allowed"
            min={0}
          />
          <span className="text-sm text-slate-500">tokens</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={monthlyEnabled}
              onChange={(e) => setMonthlyEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-deep-border bg-deep-surface text-neon-blue focus:ring-neon-blue"
            />
            <span className="text-sm text-slate-400">启用</span>
          </label>
        </div>

        {/* 保存按钮和消息 */}
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

export default UsageLimitsComponent;