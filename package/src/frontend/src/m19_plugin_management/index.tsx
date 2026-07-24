/** 插件管理页面 — 浏览市场 + 管理已安装插件 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import { PluginCard } from './components/PluginCard';
import {
  fetchInstalledPlugins,
  fetchAvailablePlugins,
  installPlugin,
  togglePlugin,
  uninstallPlugin,
  testPlugin,
  updatePlugin,
} from './api';
import type { PluginInfo } from './types';

type TabKey = 'installed' | 'market';

export default function PluginManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('installed');
  const [installedPlugins, setInstalledPlugins] = useState<PluginInfo[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configModal, setConfigModal] = useState<{
    open: boolean;
    plugin: PluginInfo | null;
  }>({ open: false, plugin: null });
  const [configValues, setConfigValues] = useState<string>('{}');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadInstalled = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInstalledPlugins();
      setInstalledPlugins(data);
    } catch {
      setError('加载已安装插件失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAvailablePlugins();
      setAvailablePlugins(data);
    } catch {
      setError('加载插件市场失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'installed') {
      loadInstalled();
    } else {
      loadAvailable();
    }
  }, [activeTab, loadInstalled, loadAvailable]);

  const handleInstall = async (pluginId: string) => {
    try {
      await installPlugin({ plugin_id: pluginId });
      showToast('插件安装成功');
      loadAvailable();
      loadInstalled();
    } catch {
      showToast('插件安装失败', 'error');
    }
  };

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      await togglePlugin(pluginId, { enabled });
      showToast(enabled ? '插件已启用' : '插件已禁用');
      loadInstalled();
    } catch {
      showToast('操作失败', 'error');
    }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      await uninstallPlugin(pluginId);
      showToast('插件已卸载');
      loadInstalled();
      loadAvailable();
    } catch {
      showToast('卸载失败', 'error');
    }
  };

  const handleTest = async (pluginId: string) => {
    try {
      const result = await testPlugin(pluginId);
      if (result.success) {
        showToast(result.message);
      } else {
        showToast(result.message, 'warning');
      }
    } catch {
      showToast('测试连接失败', 'error');
    }
  };

  const handleConfigure = (plugin: PluginInfo) => {
    setConfigValues(JSON.stringify(plugin.config || {}, null, 2));
    setConfigModal({ open: true, plugin });
  };

  const handleSaveConfig = async () => {
    const plugin = configModal.plugin;
    if (!plugin) return;

    try {
      const parsed = JSON.parse(configValues);
      await updatePlugin(plugin.plugin_id, { config: parsed });
      showToast('配置已更新');
      setConfigModal({ open: false, plugin: null });
      loadInstalled();
    } catch (e) {
      if (e instanceof SyntaxError) {
        showToast('JSON 格式错误，请检查', 'error');
      } else {
        showToast('保存配置失败', 'error');
      }
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'installed', label: '已安装', count: installedPlugins.length },
    { key: 'market', label: '插件市场', count: availablePlugins.length },
  ];

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Toast 通知 */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`rounded-lg border px-4 py-3 shadow-lg text-sm font-medium ${
                toast.type === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : toast.type === 'warning'
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {toast.message}
            </div>
          </motion.div>
      )}

      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">插件管理</h1>
        <p className="mt-1 text-sm text-slate-400">
          管理 Business Logic Agent 的插件和技能，扩展 AI Agent 能力
        </p>
      </motion.div>

      {/* Tab 切换 */}
      <motion.div variants={itemVariants} className="mb-6 border-b border-deep-border">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-neon-blue text-neon-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs text-slate-500">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 错误提示 */}
      {error && (
        <motion.div variants={itemVariants} className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            onClick={() => {
              if (activeTab === 'installed') loadInstalled();
              else loadAvailable();
            }}
            className="ml-2 underline hover:no-underline"
          >
            重试
          </button>
        </motion.div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <motion.div variants={itemVariants} className="flex justify-center py-16">
          <div className="flex items-center gap-2 text-slate-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">加载中...</span>
          </div>
        </motion.div>
      ) : activeTab === 'installed' ? (
        /* 已安装标签页 */
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              已安装 {installedPlugins.length} 个插件
            </span>
            <button
              onClick={loadInstalled}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>

          {installedPlugins.length === 0 ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-slate-500">
              <svg className="mb-3 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="mb-4 text-sm text-slate-500">暂无已安装的插件</p>
              <button
                onClick={() => setActiveTab('market')}
                className="rounded-lg bg-neon-blue/20 px-4 py-2 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 transition-colors"
              >
                前往插件市场安装
              </button>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-3">
              {installedPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.plugin_id}
                  plugin={plugin}
                  onToggle={handleToggle}
                  onUninstall={handleUninstall}
                  onTest={handleTest}
                  onConfigure={handleConfigure}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* 插件市场标签页 */
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              可用插件 {availablePlugins.length} 个
            </span>
            <button
              onClick={loadAvailable}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>

          <motion.div variants={itemVariants} className="space-y-3">
            {availablePlugins.map((plugin) => (
              <PluginCard
                key={plugin.plugin_id}
                plugin={plugin}
                marketMode
                onInstall={handleInstall}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* 配置编辑弹窗 */}
      {configModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfigModal({ open: false, plugin: null })}>
          <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              配置 - {configModal.plugin?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              插件配置以 JSON 格式编辑，敏感字段（如 API Key）会自动加密存储
            </p>
            <textarea
              rows={12}
              value={configValues}
              onChange={(e) => setConfigValues(e.target.value)}
              className="w-full rounded-lg border border-deep-border bg-deep-surface p-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-neon-blue focus:outline-none"
              placeholder='{"key": "value"}'
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfigModal({ open: false, plugin: null })}
                className="rounded-lg border border-deep-border px-4 py-2 text-sm text-slate-400 hover:bg-deep-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveConfig}
                className="rounded-lg bg-neon-blue/20 px-4 py-2 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 transition-colors"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AnimatedPageWrapper>
  );
}