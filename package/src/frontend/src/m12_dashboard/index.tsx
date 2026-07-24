/** M12 Dashboard 模块 — 首页入口
 *
 * 科技深色风：Ant Design 深色主题 + 粒子背景 + 玻璃拟态布局 + framer-motion 页面动画。
 * 组合欢迎横幅、待处理事项、自动完成事项、快速入口、项目列表和通知摘要。
 */

import { ConfigProvider, Spin, Alert, theme as antdTheme } from 'antd';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ParticleBackground } from '@/shared/components/ParticleBackground';
import { WelcomeBanner } from './components/WelcomeBanner';
import { PendingTasks } from './components/PendingTasks';
import { AutoCompletedTasks } from './components/AutoCompletedTasks';
import { QuickActions } from './components/QuickActions';
import { ProjectList } from './components/ProjectList';
import { NotificationSummary } from './components/NotificationSummary';
import { useDashboard } from './hooks/useDashboard';
import UserProfileModal from '@/m21_user_profile';

/** Ant Design 深色主题 token 配置 */
const darkTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#00d4ff',
    colorBgContainer: 'rgba(36, 36, 36, 0.6)',
    colorBgElevated: '#242424',
    colorBorder: '#333333',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorSuccess: '#00ff9d',
    colorWarning: '#fbbf24',
    colorError: '#ff2e88',
    colorInfo: '#00d4ff',
    borderRadius: 8,
    fontSize: 14,
  },
};

export default function DashboardPage() {
  const { data, isLoading, error, wsStatus } = useDashboard();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <ConfigProvider theme={darkTheme}>
      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 网格纹理叠加 */}
      <div className="grid-bg fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen gradient-mesh">
        {/* 加载中状态 */}
        {isLoading && (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <Spin size="large" />
              <p className="mt-4 text-sm text-slate-400">加载中...</p>
            </div>
          </div>
        )}

        {/* 错误状态（无数据时） */}
        {error && !data && (
          <div className="flex min-h-screen items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card max-w-sm p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neon-pink/30 bg-neon-pink/10">
                <span className="text-2xl">⚠</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">加载失败</h2>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="neon-btn-blue mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                重新加载
              </button>
            </motion.div>
          </div>
        )}

        {/* 无数据状态 */}
        {!isLoading && !error && !data && (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-slate-500">暂无数据</p>
          </div>
        )}

        {/* 正常状态 */}
        {data && (
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            {/* WebSocket 连接状态指示器 */}
            {wsStatus === 'fallback' && (
              <Alert
                type="warning"
                showIcon
                message="实时连接不可用，正在使用轮询模式更新数据"
                className="mb-4 !border-yellow-400/30 !bg-yellow-400/10"
              />
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* 第一行：欢迎横幅 */}
              <WelcomeBanner user={data.user} onAvatarClick={() => setProfileOpen(true)} />

              {/* 第二行：快速入口 + 待处理 + 自动完成 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                <div className="space-y-4">
                  <QuickActions />
                </div>
                <div className="space-y-4 lg:col-span-2">
                  <PendingTasks tasks={data.pending_tasks} />
                  <AutoCompletedTasks tasks={data.recent_auto_completed} />
                </div>
              </motion.div>

              {/* 第三行：项目列表 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <ProjectList projects={data.projects} />
              </motion.div>

              {/* 第四行：通知摘要 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <NotificationSummary notifications={data.notifications} />
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* 用户设置弹窗 */}
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </ConfigProvider>
  );
}

export { useDashboard } from './hooks/useDashboard';
export type {
  DashboardData,
  DashboardUser,
  PendingTask,
  PendingTaskPriority,
  PendingTaskType,
  AutoCompletedTask,
  ProjectWithProgress,
  ProjectStatus,
  Notification,
  NotificationType,
  DashboardState,
  ProjectFilter,
} from './types';
