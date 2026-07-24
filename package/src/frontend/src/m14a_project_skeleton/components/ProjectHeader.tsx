/** M14a 项目头部组件 */

import type { FC } from 'react';
import type { ProjectDetail } from '../types';
import { STAGE_LABELS, PROJECT_STATUS_LABELS } from '../types';

interface ProjectHeaderProps {
  project: ProjectDetail;
}

const ProjectHeader: FC<ProjectHeaderProps> = ({ project }) => {
  const statusColorMap: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400',
    paused: 'bg-amber-500/10 text-amber-400',
    completed: 'bg-blue-500/10 text-blue-400',
    archived: 'bg-deep-surface text-slate-500',
  };

  const statusDotMap: Record<string, string> = {
    active: 'bg-emerald-500',
    paused: 'bg-amber-500',
    completed: 'bg-blue-500',
    archived: 'bg-slate-400',
  };

  const statusColor = statusColorMap[project.status] ?? 'bg-deep-surface text-slate-500';
  const statusDot = statusDotMap[project.status] ?? 'bg-slate-400';
  const statusLabel = PROJECT_STATUS_LABELS[project.status] ?? project.status;
  const stageLabel = STAGE_LABELS[project.currentStage] ?? project.currentStage;
  const progressPercent = Math.min(100, Math.max(0, project.progress));

  return (
    <div className="bg-deep-card border-b border-deep-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：项目名称与状态 */}
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-xl font-bold text-slate-100 truncate">
            {project.name}
          </h1>

          <span className="px-2 py-0.5 text-xs rounded-md bg-deep-surface text-slate-500 shrink-0">
            {project.complexity === 'standard' ? '标准模式' : project.complexity === 'lite' ? '轻量模式' : project.complexity === 'full' ? '完整模式' : '自动模式'}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>

          <span className="text-sm text-slate-500 shrink-0">
            {stageLabel}阶段
          </span>
        </div>

        {/* 右侧：进度条与操作按钮 */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">进度</span>
            <div className="w-28 h-2 bg-deep-base rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-blue rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400 w-8 text-right">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border border-deep-border text-slate-400 hover:bg-deep-surface transition-colors"
            >
              暂停
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md bg-neon-blue text-white hover:bg-neon-blue/80 transition-colors"
            >
              推进到下一阶段
            </button>
            <button
              type="button"
              className="px-2 py-1.5 text-sm rounded-md border border-deep-border text-slate-600 hover:text-slate-400 hover:bg-deep-surface transition-colors"
              title="更多操作"
            >
              ···
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;