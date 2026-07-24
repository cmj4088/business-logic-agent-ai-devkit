/** M18 用量与设置模块 — 统一入口 */

import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import ProjectUsage from './components/ProjectUsage';
import DailyTrendChart from './components/DailyTrendChart';
import UsageLimitsComponent from './components/UsageLimits';
import BudgetAlertsComponent from './components/BudgetAlerts';
import GeneralSettings from './components/GeneralSettings';
import DataManagement from './components/DataManagement';
import AboutPage from './components/AboutPage';
import AgentConfigPage from '@/m17_agent_config';
import { useUsage } from './hooks/useUsage';
import { useSettings } from './hooks/useSettings';

/** 侧边导航链接 */
function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2 text-sm rounded transition-colors ${
          isActive
            ? 'bg-neon-blue/10 text-neon-blue font-medium'
            : 'text-slate-400 hover:bg-deep-card hover:text-slate-200'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

/** 用量统计页面 */
function UsagePage() {
  const usage = useUsage();

  if (usage.isLoading) {
    return (
      <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
        <p className="text-slate-500">加载中...</p>
      </motion.div>
    );
  }

  if (usage.error) {
    return (
      <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
        <p className="text-red-400">{usage.error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <DailyTrendChart data={usage.dailyTrends} />
      <ProjectUsage projects={usage.projects} />
      {usage.limits && <UsageLimitsComponent limits={usage.limits} onSave={usage.updateLimits} />}
      {usage.budgetAlerts && <BudgetAlertsComponent alerts={usage.budgetAlerts} onSave={usage.updateBudgetAlerts} />}
    </motion.div>
  );
}

/** 全局设置页面 */
function GeneralPage() {
  const settings = useSettings();

  if (settings.isLoading) {
    return (
      <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
        <p className="text-slate-500">加载中...</p>
      </motion.div>
    );
  }

  if (settings.error) {
    return (
      <motion.div variants={itemVariants} className="flex items-center justify-center py-20">
        <p className="text-red-400">{settings.error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      {settings.settings && (
        <GeneralSettings
          settings={settings.settings}
          onSave={settings.saveSettings}
          isSaving={settings.isSaving}
        />
      )}
      <DataManagement onExport={settings.exportData} onClear={settings.clearAllData} />
    </motion.div>
  );
}

export default function SettingsPage() {
  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="flex min-h-screen">
        {/* 侧边导航 */}
        <motion.aside variants={itemVariants} className="w-48 bg-deep-surface border-r border-deep-border p-3 flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-100 mb-4">设置</h1>
          <nav className="space-y-1">
            <NavItem to="/settings/usage" label="用量统计" />
            <NavItem to="/settings/general" label="全局设置" />
            <NavItem to="/settings/agent-config" label="Agent 配置" />
            <NavItem to="/settings/about" label="关于" />
          </nav>
        </motion.aside>

        {/* 主内容区 */}
        <motion.main variants={itemVariants} className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="usage" element={<UsagePage />} />
            <Route path="general" element={<GeneralPage />} />
            <Route path="agent-config" element={<AgentConfigPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="usage" replace />} />
          </Routes>
        </motion.main>
      </div>
    </AnimatedPageWrapper>
  );
}

export { useUsage } from './hooks/useUsage';
export { useSettings } from './hooks/useSettings';