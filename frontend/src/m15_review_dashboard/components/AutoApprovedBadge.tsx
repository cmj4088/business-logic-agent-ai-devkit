/** 自动通过标识组件 */

interface AutoApprovedBadgeProps {
  showDetail?: boolean;
}

export function AutoApprovedBadge({ showDetail = false }: AutoApprovedBadgeProps) {
  return (
    <div className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-deep-surface px-2.5 py-0.5 text-xs font-medium text-slate-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        自动通过
      </span>
      {showDetail && (
        <p className="text-xs text-slate-500 italic">
          单人模式：自动通过，未经人工实质审查
        </p>
      )}
    </div>
  );
}