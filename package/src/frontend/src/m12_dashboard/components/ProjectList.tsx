/** M12 Dashboard — 项目列表组件
 *
 * 科技深色风：玻璃拟态卡片 + Ant Design Progress 进度条 + DaisyUI 筛选 tabs。
 * 展示用户的所有项目（含状态、进度、阶段），支持按状态筛选。
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress, Button } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ProjectWithProgress, ProjectFilter, ProjectStatus } from '../types';
import type { IPDStage } from '@/shared/types';

interface ProjectListProps {
  projects: ProjectWithProgress[];
}

/** IPD 阶段中文标签 */
const STAGE_LABELS: Record<IPDStage, string> = {
  concept: '概念阶段',
  plan: '计划阶段',
  develop: '开发阶段',
  verify: '验证阶段',
  launch: '发布阶段',
  lifecycle: '生命周期阶段',
};

/** 项目状态配置 */
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; dot: string; text: string; glow: string }
> = {
  active: {
    label: '进行中',
    dot: 'bg-neon-green',
    text: 'text-neon-green',
    glow: 'shadow-[0_0_6px_rgba(0,255,157,0.5)]',
  },
  completed: {
    label: '已完成',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    glow: '',
  },
  paused: {
    label: '已暂停',
    dot: 'bg-yellow-400',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_6px_rgba(250,204,21,0.4)]',
  },
};

/** 进度条颜色配置 */
function getProgressColor(progress: number): string {
  if (progress >= 100) return '#64748b';
  if (progress >= 60) return '#00ff9d';
  if (progress >= 30) return '#fbbf24';
  return '#00d4ff';
}

const FILTER_OPTIONS: { value: ProjectFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

export function ProjectList({ projects }: ProjectListProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ProjectFilter>('all');

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  return (
    <div className="glass-card overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-deep-border px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-200">我的项目</h2>
        <div className="flex items-center gap-2">
          {/* DaisyUI 风格筛选 tabs */}
          <div className="flex rounded-lg border border-deep-border bg-deep-base/50 p-0.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-neon-blue/20 text-neon-blue shadow-[0_0_8px_rgba(0,212,255,0.2)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* 创建新项目按钮 */}
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => navigate('/projects/new')}
            className="neon-btn-blue !border-none !font-medium"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%)' }}
          >
            创建新项目
          </Button>
        </div>
      </div>

      {/* 空状态 */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center px-5 py-12 text-center"
        >
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-deep-border bg-deep-surface/50">
            <AppstoreOutlined className="text-2xl text-slate-600" />
          </div>
          {projects.length === 0 ? (
            <>
              <p className="text-sm font-medium text-slate-300">还没有项目</p>
              <p className="mt-1 text-xs text-slate-500">
                创建你的第一个 IPD 项目，开始智能开发流程
              </p>
              <button
                type="button"
                onClick={() => navigate('/projects/new')}
                className="neon-btn-blue mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                创建新项目
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500">没有符合筛选条件的项目</p>
          )}
        </motion.div>
      ) : (
        /* 项目列表 */
        <div className="divide-y divide-deep-border">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => {
              const statusConfig = STATUS_CONFIG[project.status];
              const progressColor = getProgressColor(project.progress);

              return (
                <motion.button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-deep-surface/50"
                >
                  {/* 状态指示点 */}
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusConfig.dot} ${statusConfig.glow}`}
                    title={statusConfig.label}
                  />

                  {/* 项目信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-slate-100">{project.name}</h3>
                      <span className={`text-xs ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {STAGE_LABELS[project.currentStage] ?? project.currentStage}
                      {' · '}
                      创建于{' '}
                      {new Date(project.createdAt).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* 进度条 */}
                  <div className="flex w-32 items-center gap-2">
                    <Progress
                      percent={Math.min(project.progress, 100)}
                      size="small"
                      strokeColor={progressColor}
                      trailColor="#1e2a4a"
                      showInfo={false}
                      className="!m-0 !w-full"
                    />
                    <span className="w-10 text-right text-xs text-slate-400">
                      {project.progress}%
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
