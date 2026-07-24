/** M12 Dashboard — 待处理事项组件
 *
 * 科技深色风：玻璃拟态卡片 + 霓虹优先级指示 + framer-motion 交错列表动画。
 * 展示需要用户操作的审核/投票/门禁，按优先级排序。
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tag } from 'antd';
import type { PendingTask, PendingTaskPriority, PendingTaskType } from '../types';

interface PendingTasksProps {
  tasks: PendingTask[];
}

/** 优先级排序权重 */
const PRIORITY_ORDER: Record<PendingTaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** 优先级对应的颜色配置 */
const PRIORITY_CONFIG: Record<
  PendingTaskPriority,
  { dot: string; glow: string; tagColor: string }
> = {
  high: {
    dot: 'bg-neon-pink',
    glow: 'shadow-[0_0_8px_rgba(255,46,136,0.6)]',
    tagColor: 'error',
  },
  medium: {
    dot: 'bg-yellow-400',
    glow: 'shadow-[0_0_8px_rgba(250,204,21,0.5)]',
    tagColor: 'warning',
  },
  low: {
    dot: 'bg-slate-500',
    glow: '',
    tagColor: 'default',
  },
};

/** 任务类型标签 */
const TYPE_LABELS: Record<PendingTaskType, string> = {
  review: '审核',
  vote: '投票',
  gate: '门禁',
};

export function PendingTasks({ tasks }: PendingTasksProps) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const orderA = PRIORITY_ORDER[a.priority] ?? 99;
      const orderB = PRIORITY_ORDER[b.priority] ?? 99;
      return orderA - orderB;
    });
  }, [tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-200">需要你处理</h2>
        <span className="rounded-full bg-neon-pink/20 px-2 py-0.5 text-xs font-medium text-neon-pink">
          {tasks.length}
        </span>
      </div>
      <ul className="space-y-2">
        {sortedTasks.map((task, index) => {
          const config = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low;
          const typeLabel = TYPE_LABELS[task.type] ?? task.type;

          return (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
              className="rounded-lg border border-deep-border bg-deep-surface/50 p-3 transition-colors hover:border-neon-blue/30 hover:bg-deep-surface/80"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dot} ${config.glow}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100">{task.title}</span>
                    <Tag color={config.tagColor} className="!text-xs !border-none">
                      {typeLabel}
                    </Tag>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {task.projectName} — {task.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{task.waitingSince}</p>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
