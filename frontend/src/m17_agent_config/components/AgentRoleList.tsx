/** M17 Agent 角色列表 — 展示 6 个 Agent 角色及操作 */

import type { AgentRole } from '@/shared/types';
import { AGENT_ROLE_META } from '../types';

interface AgentRoleListProps {
  onViewPrompt: (role: AgentRole) => void;
  onTestRole: (role: AgentRole) => void;
  onManagePlugins: (role: AgentRole) => void;
  disabled?: boolean;
}

export function AgentRoleList({
  onViewPrompt,
  onTestRole,
  onManagePlugins,
  disabled = false,
}: AgentRoleListProps) {
  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-200">Agent 角色</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_ROLE_META.map((meta) => (
          <div
            key={meta.role}
            className="flex flex-col rounded-lg border border-deep-border bg-deep-surface p-4 transition-colors hover:border-neon-blue/30 hover:bg-neon-blue/5"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {meta.icon}
              </span>
              <span className="text-sm font-medium text-slate-200">{meta.label}</span>
            </div>
            <p className="mb-3 flex-1 text-xs text-slate-500">{meta.description}</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onViewPrompt(meta.role)}
                  disabled={disabled}
                  className="flex-1 rounded-md border border-deep-border bg-deep-surface px-2 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  查看提示词
                </button>
                <button
                  type="button"
                  onClick={() => onTestRole(meta.role)}
                  disabled={disabled}
                  className="flex-1 rounded-md border border-neon-blue/30 bg-neon-blue/10 px-2 py-1.5 text-xs font-medium text-neon-blue transition-colors hover:bg-neon-blue/20 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  测试
                </button>
              </div>
              <button
                type="button"
                onClick={() => onManagePlugins(meta.role)}
                disabled={disabled}
                className="flex items-center justify-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                管理插件
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}