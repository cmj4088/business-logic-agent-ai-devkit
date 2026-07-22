import type { ComplexityPreview as ComplexityPreviewType } from '../types';

interface ComplexityPreviewProps {
  preview: ComplexityPreviewType;
}

const TIER_LABELS: Record<string, string> = {
  auto: '自动',
  lite: '轻量模式',
  standard: '标准模式',
  full: '完整模式',
};

const TIER_COLORS: Record<string, string> = {
  auto: 'bg-deep-surface text-slate-400 border-deep-border',
  lite: 'bg-green-500/10 text-green-400 border-green-500/30',
  standard: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  full: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export function ComplexityPreview({ preview }: ComplexityPreviewProps) {
  const colorClass = TIER_COLORS[preview.tier] ?? TIER_COLORS.standard;

  return (
    <div className="rounded-lg border border-deep-border bg-deep-card p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">复杂度预览</h3>

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
          {TIER_LABELS[preview.tier] ?? preview.tier}
        </span>
        <span className="text-xs text-slate-400">{preview.reason}</span>
      </div>

      <div className="flex gap-6 text-sm text-slate-400">
        <div>
          <span className="text-slate-500">活动数：</span>
          <span className="font-medium text-slate-200">{preview.activity_count}</span>
        </div>
        <div>
          <span className="text-slate-500">预计周期：</span>
          <span className="font-medium text-slate-200">{preview.estimated_duration}</span>
        </div>
      </div>
    </div>
  );
}