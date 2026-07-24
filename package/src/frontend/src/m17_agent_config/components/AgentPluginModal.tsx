/** M17 Agent 插件分配弹窗 — 为单个 Agent 角色选择插件 */

import { useState, useEffect, useCallback } from 'react';
import type { PluginInfo } from '@/m19_plugin_management/types';
import { fetchInstalledPlugins } from '@/m19_plugin_management/api';
import { fetchAgentPlugins, setAgentPlugins } from '../api';

interface AgentPluginModalProps {
  /** Agent 角色标识 */
  agentRole: string;
  /** Agent 角色显示名 */
  agentLabel: string;
  /** Agent 图标 */
  agentIcon: string;
  /** 关闭弹窗 */
  onClose: () => void;
}

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

export function AgentPluginModal({
  agentRole,
  agentLabel,
  agentIcon,
  onClose,
}: AgentPluginModalProps) {
  const [allPlugins, setAllPlugins] = useState<PluginInfo[]>([]);
  const [assignedPluginIds, setAssignedPluginIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, assigned] = await Promise.all([
        fetchInstalledPlugins(),
        fetchAgentPlugins(agentRole),
      ]);
      setAllPlugins(installed);
      setAssignedPluginIds(new Set(assigned.map((p) => p.plugin_id)));
    } catch {
      showToast('加载插件列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [agentRole, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** 切换插件选中状态 */
  const togglePlugin = (pluginId: string) => {
    setAssignedPluginIds((prev) => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  };

  /** 保存分配 */
  const handleSave = async () => {
    setSaving(true);
    try {
      await setAgentPlugins(agentRole, Array.from(assignedPluginIds));
      showToast(`已更新「${agentLabel}」的插件分配`, 'success');
      setTimeout(onClose, 1000);
    } catch {
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  /** 获取插件分类颜色 */
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'IPD 技能': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      '工具': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return colors[category] || 'bg-deep-surface text-slate-400 border-deep-border';
  };

  /** 获取插件分类图标 */
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'IPD 技能': '🧠',
      '工具': '🔧',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-deep-card shadow-2xl border border-deep-border">
        {/* Toast 通知 */}
        {toast && (
          <div className="absolute top-3 right-3 z-20">
            <div
              className={`rounded-lg px-4 py-2.5 shadow-lg text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}

        {/* 标题 */}
        <div className="flex items-center justify-between border-b border-deep-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{agentIcon}</span>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {agentLabel} — 插件分配
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                选择该 Agent 角色可使用的插件
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-deep-surface hover:text-slate-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
              <span className="ml-2 text-sm text-slate-500">加载中...</span>
            </div>
          ) : allPlugins.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">暂无已安装的插件</p>
              <p className="mt-1 text-xs text-slate-500">
                请先在「插件管理」中安装插件
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allPlugins.map((plugin) => {
                const isAssigned = assignedPluginIds.has(plugin.plugin_id);
                return (
                  <label
                    key={plugin.plugin_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isAssigned
                        ? 'border-neon-blue/30 bg-neon-blue/5'
                        : 'border-deep-border bg-deep-card hover:border-deep-surface'
                    }`}
                  >
                    {/* 复选框 */}
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isAssigned
                          ? 'border-neon-blue bg-neon-blue'
                          : 'border-slate-500 bg-deep-surface'
                      }`}
                    >
                      {isAssigned && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* 插件信息 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span>{getCategoryIcon(plugin.category)}</span>
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {plugin.name}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getCategoryColor(plugin.category)}`}>
                          {plugin.category}
                        </span>
                        {!plugin.enabled && (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                            已禁用
                          </span>
                        )}
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

                    {/* 点击区域（radio 样式） */}
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => togglePlugin(plugin.plugin_id)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 border-t border-deep-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-deep-border disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {saving ? '保存中...' : '保存分配'}
          </button>
        </div>
      </div>
    </div>
  );
}