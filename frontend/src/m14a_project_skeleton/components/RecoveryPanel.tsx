/** M14b RecoveryPanel — 异常恢复面板
 *
 * 当 Agent 执行出错时显示，提供可操作的恢复选项。
 * 支持 4 种异常场景：辩论死锁、Agent 超时、LLM 不可用、产出质量差。
 */

import type { FC } from 'react';
import type { RecoveryAction } from '../types';

interface RecoveryPanelProps {
  /** 恢复动作 */
  action: RecoveryAction;
  /** 是否正在执行恢复 */
  isExecuting: boolean;
  /** 执行恢复动作 */
  onExecute: (actionId: string, resolution: string) => void;
  /** 关闭面板 */
  onClose: () => void;
}

/** 异常类型图标和颜色 */
const ACTION_TYPE_STYLES: Record<string, { icon: string; bg: string; border: string }> = {
  regenerate: {
    icon: '🔄',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  switch_model: {
    icon: '🔀',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  moderator_decide: {
    icon: '⚖️',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  restart_debate: {
    icon: '🔁',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  proceed_with_issues: {
    icon: '⚠️',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
};

const RecoveryPanel: FC<RecoveryPanelProps> = ({
  action,
  isExecuting,
  onExecute,
  onClose,
}) => {
  const styles = ACTION_TYPE_STYLES[action.type] ?? ACTION_TYPE_STYLES.regenerate;

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-5 shadow-sm`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{styles.icon}</span>
          <div>
            <h3 className="text-base font-semibold text-slate-100">{action.title}</h3>
            <p className="mt-0.5 text-sm text-slate-400">{action.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-deep-surface hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 恢复选项 */}
      <div className="space-y-2">
        {action.options.map((option, index) => {
          const buttonStyle = {
            primary: 'bg-neon-blue text-white hover:bg-neon-blue/80 focus:ring-neon-blue',
            secondary: 'border border-deep-border bg-deep-card text-slate-300 hover:bg-deep-surface focus:ring-slate-400',
            link: 'text-neon-blue hover:text-neon-blue/80 hover:underline',
          }[option.type] ?? 'border border-deep-border bg-deep-card text-slate-300 hover:bg-deep-surface focus:ring-slate-400';

          return (
            <button
              key={index}
              type="button"
              onClick={() => onExecute(action.id, option.action)}
              disabled={isExecuting}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
            >
              {isExecuting ? '执行中...' : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RecoveryPanel;