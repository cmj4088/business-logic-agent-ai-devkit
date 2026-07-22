/** M12 Dashboard — 自动完成事项组件
 *
 * 科技深色风：玻璃拟态卡片 + 霓虹绿时间线 + framer-motion 渐入。
 * 展示 Agent 最近自动完成的工作。
 */

import { motion } from 'framer-motion';
import { CheckCircleFilled } from '@ant-design/icons';
import type { AutoCompletedTask } from '../types';

interface AutoCompletedTasksProps {
  tasks: AutoCompletedTask[];
}

/** 格式化时间为相对时间 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (Number.isNaN(then)) return dateStr;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function AutoCompletedTasks({ tasks }: AutoCompletedTasksProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-200">自动完成</h2>
        <CheckCircleFilled className="text-neon-green text-xs" />
      </div>

      {/* 垂直时间线 */}
      <div className="relative">
        {/* 时间线竖线 */}
        <div
          className="absolute left-3 top-2 bottom-2 w-px"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,255,157,0.4) 0%, rgba(0,255,157,0.05) 100%)',
          }}
        />
        <ul className="space-y-3">
          {tasks.map((task, index) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
              className="relative pl-8"
            >
              {/* 时间线节点 */}
              <span className="absolute left-1.5 top-1 flex h-3 w-3 items-center justify-center">
                <span className="absolute h-3 w-3 rounded-full bg-neon-green/20" />
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_6px_rgba(0,255,157,0.6)]" />
              </span>
              <div className="rounded-lg border border-deep-border bg-deep-surface/50 p-2.5 transition-colors hover:border-neon-green/20">
                <p className="text-sm text-slate-200">
                  <span className="font-medium text-neon-green">{task.projectName}</span>
                  {' — '}
                  {task.description}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatRelativeTime(task.completedAt)}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
