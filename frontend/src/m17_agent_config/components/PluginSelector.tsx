/** M17 Agent 插件选择器 — 在 Agent 配置页面中直接安装/管理插件 */

import { useState, useEffect, useCallback } from 'react';
import type { PluginInfo } from '@/m19_plugin_management/types';
import {
  fetchInstalledPlugins,
  fetchAvailablePlugins,
  installPlugin,
  uninstallPlugin,
  togglePlugin,
} from '@/m19_plugin_management/api';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export function PluginSelector() {
  const [installed, setInstalled] = useState<PluginInfo[]>([]);
  const [available, setAvailable] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showMarket, setShowMarket] = useState(false);

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installedData, availableData] = await Promise.all([
        fetchInstalledPlugins(),
        fetchAvailablePlugins(),
      ]);
      setInstalled(installedData);
      setAvailable(availableData);
    } catch {
      showToast('加载插件列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** 安装插件 */
  const handleInstall = async (pluginId: string) => {
    try {
      const result = await installPlugin({ plugin_id: pluginId });
      showToast(`插件「${result.name}」安装成功`, 'success');
      await loadData();
    } catch {
      showToast('安装失败，请重试', 'error');
    }
  };

  /** 卸载插件 */
  const handleUninstall = async (pluginId: string, pluginName: string) => {
    try {
      await uninstallPlugin(pluginId);
      showToast(`插件「${pluginName}」已卸载`, 'success');
      await loadData();
    } catch {
      showToast('卸载失败，请重试', 'error');
    }
  };

  /** 切换启用/禁用 */
  const handleToggle = async (pluginId: string, currentEnabled: boolean) => {
    try {
      await togglePlugin(pluginId, { enabled: !currentEnabled });
      showToast(currentEnabled ? '已禁用' : '已启用', 'success');
      await loadData();
    } catch {
      showToast('操作失败', 'error');
    }
  };

  /** 获取插件分类的显示颜色 */
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'IPD 技能': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      '工具': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return colors[category] || 'bg-deep-surface text-slate-400 border-deep-border';
  };

  /** 获取插件分类的图标 */
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'IPD 技能': '🧠',
      '工具': '🔧',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      {/* Toast 通知 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : toast.type === 'warning'
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100">插件管理</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            为 Agent 安装 IPD 技能插件，扩展 AI 能力
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMarket(!showMarket)}
          className="flex items-center gap-1.5 rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-3 py-1.5 text-xs font-medium text-neon-blue transition-colors hover:bg-neon-blue/20"
        >
          <span>{showMarket ? '✓ 完成' : '🛒 插件市场'}</span>
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
          <span className="ml-2 text-sm text-slate-500">加载中...</span>
        </div>
      )}

      {/* 插件市场模式 */}
      {showMarket && !loading && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-400">📦 可用插件</p>
          {available.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">暂无可用插件</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {available.map((plugin) => {
                const isInstalled = installed.some((p) => p.plugin_id === plugin.plugin_id);
                return (
                  <div
                    key={plugin.plugin_id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isInstalled
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-deep-border bg-deep-card hover:border-neon-blue/30'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>{getCategoryIcon(plugin.category)}</span>
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {plugin.name}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getCategoryColor(plugin.category)}`}>
                          {plugin.category}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {plugin.description}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {plugin.tools.map((tool) => (
                          <span
                            key={tool.tool_name}
                            className="inline-flex items-center rounded bg-deep-surface px-1.5 py-0.5 text-[10px] text-slate-500"
                          >
                            {tool.tool_name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {isInstalled ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          已安装
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInstall(plugin.plugin_id)}
                          className="rounded-md border border-neon-blue/30 bg-neon-blue/10 px-2.5 py-1 text-xs font-medium text-neon-blue transition-colors hover:bg-neon-blue/20"
                        >
                          安装
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-slate-500 mt-2">
            提示：安装后可在「已安装插件」中管理。更多插件请访问
            <a href="/plugins" className="text-neon-blue hover:text-neon-blue/80 ml-1">
              完整插件市场 →
            </a>
          </p>
        </div>
      )}

      {/* 已安装插件列表 */}
      {!showMarket && !loading && (
        <div className="space-y-2">
          {installed.length === 0 ? (
            <div className="rounded-lg border border-dashed border-deep-border p-6 text-center">
              <p className="text-sm text-slate-500">暂无已安装的插件</p>
              <button
                type="button"
                onClick={() => setShowMarket(true)}
                className="mt-2 text-xs font-medium text-neon-blue hover:text-neon-blue/80"
              >
                前往插件市场安装 →
              </button>
            </div>
          ) : (
            installed.map((plugin) => (
              <div
                key={plugin.plugin_id}
                className="flex items-center justify-between rounded-lg border border-deep-border bg-deep-surface/50 p-3 transition-colors hover:bg-deep-card"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg flex-shrink-0">
                    {getCategoryIcon(plugin.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {plugin.name}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getCategoryColor(plugin.category)}`}>
                        {plugin.category}
                      </span>
                      <span className="text-[10px] text-slate-500">v{plugin.version}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {plugin.tools.map((tool) => (
                        <span
                          key={tool.tool_name}
                          className="inline-flex items-center rounded bg-deep-surface px-1.5 py-0.5 text-[10px] text-slate-500"
                        >
                          {tool.tool_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {/* 启用/禁用开关 */}
                  <button
                    type="button"
                    onClick={() => handleToggle(plugin.plugin_id, plugin.enabled ?? true)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      plugin.enabled
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                        : 'bg-deep-surface text-slate-500 border border-deep-border hover:bg-deep-border'
                    }`}
                  >
                    {plugin.enabled ? '已启用' : '已禁用'}
                  </button>
                  {/* 卸载按钮 */}
                  <button
                    type="button"
                    onClick={() => handleUninstall(plugin.plugin_id, plugin.name)}
                    className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    卸载
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}