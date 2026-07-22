/** M12 Dashboard — 欢迎横幅组件
 *
 * 科技深色风：玻璃拟态卡片 + 霓虹蓝紫渐变 + framer-motion 入场动画。
 * 展示用户名称、日期和基于时间的问候语。
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { DashboardUser } from '../types';

interface WelcomeBannerProps {
  user: DashboardUser;
  onAvatarClick?: () => void;
}

/** 根据当前时间获取问候语 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/** 格式化日期为中文格式 */
function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[now.getDay()];
  return `${year}年${month}月${day}日 星期${weekDay}`;
}

export function WelcomeBanner({ user, onAvatarClick }: WelcomeBannerProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const dateStr = useMemo(() => formatDate(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass-card relative overflow-hidden p-6"
    >
      {/* 装饰性渐变光晕 */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">{greeting}</span>
            <span className="ml-2 text-slate-100">{user.name}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">{dateStr}</p>
          {user.role && (
            <span className="mt-2 inline-flex items-center rounded-full border border-neon-purple/30 bg-neon-purple/10 px-3 py-0.5 text-xs text-neon-purple">
              {user.role}
            </span>
          )}
        </div>

        {/* 头像 — 霓虹辉光环，点击打开设置 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="relative cursor-pointer"
          onClick={onAvatarClick}
          type="button"
        >
          <div
            className="absolute inset-0 rounded-full opacity-60 blur-md"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
          />
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="relative h-14 w-14 rounded-full border-2 border-neon-blue/50 object-cover"
            />
          ) : (
            <Avatar
              size={56}
              icon={<UserOutlined />}
              className="relative border-2 border-neon-blue/50"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
              }}
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
