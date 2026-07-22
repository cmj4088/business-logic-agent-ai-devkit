/** M14b ActivityInteraction — 活动交互组件（开始/跳过/完成/bypass） */

import type { FC } from 'react';
import type { Activity } from '../types';
import { ACTIVITY_STATUS_LABELS } from '../types';

interface ActivityInteractionProps {
  activity: Activity;
  isActing: boolean;
  onStart: (activityId: string) => void;
  onSkip: (activityId: string) => void;
  onComplete: (activityId: string) => void;
  onBypass: (activityId: string) => void;
}

/** 活动状态颜色映射 */
const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-deep-border bg-deep-card',
  in_progress: 'border-l-neon-blue bg-neon-blue/5',
  completed: 'border-l-emerald-500 bg-emerald-500/5',
  skipped: 'border-l-amber-500 bg-amber-500/5',
};

const ActivityInteraction: FC<ActivityInteractionProps> = ({
  activity,
  isActing,
  onStart,
  onSkip,
  onComplete,
  onBypass,
}) => {
  const isPending = activity.status === 'pending';
  const isInProgress = activity.status === 'in_progress';
  const isDone = activity.status === 'completed' || activity.status === 'skipped';

  return (
    <div
      className={`border-l-4 rounded-lg p-4 transition-colors ${STATUS_COLORS[activity.status] ?? STATUS_COLORS.pending}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-200 truncate">{activity.name}</h4>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isInProgress
                  ? 'bg-neon-blue/15 text-neon-blue'
                  : isDone
                    ? 'bg-deep-surface text-slate-500'
                    : 'bg-deep-surface text-slate-500'
              }`}
            >
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
          </div>
          {activity.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{activity.description}</p>
          )}
          {activity.assignee && (
            <p className="text-xs text-slate-600 mt-1">负责人：{activity.assignee}</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => onStart(activity.id)}
                disabled={isActing}
                className="rounded-lg bg-neon-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isActing ? '执行中...' : '开始'}
              </button>
              {activity.isSkippable && (
                <button
                  type="button"
                  onClick={() => onSkip(activity.id)}
                  disabled={isActing}
                  className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-card focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  跳过
                </button>
              )}
            </>
          )}
          {isInProgress && (
            <>
              <button
                type="button"
                onClick={() => onComplete(activity.id)}
                disabled={isActing}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-deep-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                完成
              </button>
              <button
                type="button"
                onClick={() => onBypass(activity.id)}
                disabled={isActing}
                className="rounded-lg border border-deep-border bg-deep-surface px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-deep-card focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bypass
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityInteraction;