/** M12 Dashboard — 通知摘要组件
 *
 * 科技深色风：玻璃拟态卡片 + 霓虹类型指示 + framer-motion 列表动画。
 * 展示最近的系统通知（最多 20 条）。
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from 'antd';
import type { Notification, NotificationType } from '../types';

interface NotificationSummaryProps {
  notifications: Notification[];
}

/** 通知类型对应的样式 */
const NOTIFICATION_STYLES: Record<
  NotificationType,
  { dot: string; glow: string; bg: string }
> = {
  info: {
    dot: 'bg-neon-blue',
    glow: 'shadow-[0_0_6px_rgba(0,212,255,0.5)]',
    bg: 'bg-neon-blue/5',
  },
  warning: {
    dot: 'bg-yellow-400',
    glow: 'shadow-[0_0_6px_rgba(250,204,21,0.4)]',
    bg: 'bg-yellow-400/5',
  },
  success: {
    dot: 'bg-neon-green',
    glow: 'shadow-[0_0_6px_rgba(0,255,157,0.5)]',
    bg: 'bg-neon-green/5',
  },
  error: {
    dot: 'bg-neon-pink',
    glow: 'shadow-[0_0_6px_rgba(255,46,136,0.5)]',
    bg: 'bg-neon-pink/5',
  },
};

/** 格式化通知时间 */
function formatNotificationTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();

  if (Number.isNaN(then)) return dateStr;

  const minutes = Math.floor((now - then) / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function NotificationSummary({ notifications }: NotificationSummaryProps) {
  const displayNotifications = useMemo(() => notifications.slice(0, 20), [notifications]);

  if (displayNotifications.length === 0) {
    return (
      <div className="glass-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">最近通知</h2>
        <p className="py-6 text-center text-xs text-slate-500">暂无通知</p>
      </div>
    );
  }

  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  return (
    <div className="glass-card overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-deep-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">最近通知</h2>
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{
                background: '#ff2e88',
                boxShadow: '0 0 6px rgba(255,46,136,0.4)',
              }}
            />
          )}
        </div>
      </div>

      {/* 通知列表 */}
      <div className="divide-y divide-deep-border">
        {displayNotifications.map((notification, index) => {
          const styles = NOTIFICATION_STYLES[notification.type] ?? NOTIFICATION_STYLES.info;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className={`flex items-start gap-3 px-5 py-3 transition-colors hover:bg-deep-surface/30 ${
                !notification.read ? styles.bg : ''
              }`}
            >
              <span
                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${styles.dot} ${styles.glow}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    !notification.read ? 'font-medium text-slate-100' : 'text-slate-400'
                  }`}
                >
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {notification.message}
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 text-xs text-slate-600">
                {formatNotificationTime(notification.createdAt)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
