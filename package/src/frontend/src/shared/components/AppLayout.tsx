/** 全局应用布局 — 深色主题顶部导航栏 + 内容区
 *
 * 科技深色风：玻璃拟态导航栏 + 霓虹蓝紫 Logo + 霓虹高亮导航项。
 */

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/m11_auth_pages';
import UserProfileModal from '@/m21_user_profile';

const NAV_ITEMS = [
  { to: '/dashboard', label: '首页', icon: '🏠' },
  { to: '/projects/new', label: '创建项目', icon: '➕' },
  { to: '/templates', label: '模板', icon: '📋' },
  { to: '/reviews', label: '审核', icon: '✓' },
  { to: '/artifacts', label: '产出物', icon: '📄' },
  { to: '/plugins', label: '插件', icon: '🔌' },
  { to: '/settings/usage', label: '设置', icon: '⚙️' },
];

export function AppLayout() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-deep-base">
      {/* 顶部导航栏 — 玻璃拟态 */}
      <header className="sticky top-0 z-50 border-b border-deep-border bg-deep-surface/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo — 霓虹渐变 */}
          <div className="flex items-center gap-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold gradient-text"
            >
              BLA
            </motion.span>
            <span className="text-sm text-slate-500">Business Logic Agent</span>
          </div>

          {/* 导航链接 — 霓虹高亮 */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neon-blue/15 text-neon-blue shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                      : 'text-slate-400 hover:bg-deep-card hover:text-slate-200'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 用户信息 — 点击打开设置 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="hidden cursor-pointer text-sm text-slate-400 transition-colors hover:text-neon-blue sm:inline"
            >
              {user?.display_name || user?.email || ''}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main>
        <Outlet />
      </main>

      {/* 用户设置弹窗 */}
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
