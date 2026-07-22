/** M12 Dashboard 模块 — 类型定义 */

import type { Project } from '@/shared/types';

/** Dashboard 用户信息 */
export interface DashboardUser {
  name: string;
  avatar?: string;
  role?: string;
}

/** 待处理任务优先级 */
export type PendingTaskPriority = 'high' | 'medium' | 'low';

/** 待处理任务类型 */
export type PendingTaskType = 'review' | 'vote' | 'gate';

/** 待处理事项 */
export interface PendingTask {
  id: string;
  title: string;
  description: string;
  priority: PendingTaskPriority;
  type: PendingTaskType;
  projectId: string;
  projectName: string;
  createdAt: string;
  /** 等待时长描述，如 "已等2小时" */
  waitingSince: string;
}

/** Agent 自动完成事项 */
export interface AutoCompletedTask {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  completedAt: string;
}

/** 项目状态 */
export type ProjectStatus = 'active' | 'completed' | 'paused';

/** 带进度和状态的项目 */
export interface ProjectWithProgress extends Project {
  progress: number;
  status: ProjectStatus;
}

/** 通知类型 */
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

/** 系统通知 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

/** Dashboard 聚合响应 */
export interface DashboardData {
  user: DashboardUser;
  pending_tasks: PendingTask[];
  recent_auto_completed: AutoCompletedTask[];
  projects: ProjectWithProgress[];
  notifications: Notification[];
}

/** Dashboard 数据状态 */
export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

/** 项目列表筛选条件 */
export type ProjectFilter = 'all' | 'active' | 'completed';

/** WebSocket 推送的 Dashboard 更新 */
export interface DashboardWSMessage {
  type: 'pending_tasks_update' | 'notification' | 'project_update' | 'dashboard_refresh';
  payload: unknown;
}