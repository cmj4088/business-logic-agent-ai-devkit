/** 插件卡片组件 — 展示单个插件信息 */

import { useState } from 'react';
import type { PluginInfo } from '../types';

interface PluginCardProps {
  plugin: PluginInfo;
  marketMode?: boolean;
  onInstall?: (pluginId: string) => void;
  onToggle?: (pluginId: string, enabled: boolean) => void;
  onUninstall?: (pluginId: string) => void;
  onTest?: (pluginId: string) => void;
  onConfigure?: (plugin: PluginInfo) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  工具: 'bg-blue-500/10 text-blue-400',
  分析: 'bg-green-500/10 text-green-400',
  文档: 'bg-orange-500/10 text-orange-400',
  生成: 'bg-purple-500/10 text-purple-400',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-slate-500/10 text-slate-400';
}

export function PluginCard({
  plugin,
  marketMode = false,
  onInstall,
  onToggle,
  onUninstall,
  onTest,
  onConfigure,
}: PluginCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* 左侧信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-semibold text-slate-100 truncate">
              {plugin.name}
            </h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(plugin.category)}`}>
              {plugin.category}
            </span>
            <span className="text-xs text-slate-500">v{plugin.version}</span>
          </div>
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {plugin.description}
          </p>
          {/* 工具列表 */}
          <div className="flex flex-wrap gap-1.5">
            {plugin.tools.map((tool) => (
              <span
                key={tool.tool_name}
                className="inline-flex items-center gap-1 rounded-md bg-deep-surface px-2 py-0.5 text-xs text-slate-400 border border-deep-border"
                title={
                  typeof tool.tool_schema === 'object' && tool.tool_schema !== null
                    ? String((tool.tool_schema as Record<string, Record<string, unknown>>)
                        ?.function?.description ?? '')
                    : ''
                }
              >
                <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {tool.tool_name}
              </span>
            ))}
          </div>
        </div>

        {/* 右侧操作 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {marketMode ? (
            plugin.installed ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                已安装
              </span>
            ) : (
              <button
                onClick={() => onInstall?.(plugin.plugin_id)}
                className="rounded-lg bg-neon-blue/20 px-4 py-1.5 text-sm font-medium text-neon-blue hover:bg-neon-blue/30 transition-colors"
              >
                安装
              </button>
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {plugin.enabled ? '已启用' : '已禁用'}
                </span>
                <button
                  onClick={() => onToggle?.(plugin.plugin_id, !plugin.enabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    plugin.enabled ? 'bg-neon-blue' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                      plugin.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onTest?.(plugin.plugin_id)}
                  disabled={!plugin.enabled}
                  className="rounded-md border border-deep-border px-2 py-1 text-xs text-slate-400 hover:bg-deep-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="测试连接"
                >
                  测试
                </button>
                <button
                  onClick={() => onConfigure?.(plugin)}
                  className="rounded-md border border-deep-border px-2 py-1 text-xs text-slate-400 hover:bg-deep-surface transition-colors"
                  title="配置"
                >
                  配置
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  title="卸载"
                >
                  卸载
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 卸载确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowConfirm(false)}>
          <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">卸载插件</h3>
            <p className="text-sm text-slate-400 mb-4">
              确定要卸载 <strong className="text-slate-200">{plugin.name}</strong> 吗？卸载后插件配置将被清除。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-deep-border px-4 py-2 text-sm text-slate-400 hover:bg-deep-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  onUninstall?.(plugin.plugin_id);
                }}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
              >
                确认卸载
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}