/** M17 Agent 角色编辑器 — 编辑 Agent 角色的系统提示词 */

import { useState, useCallback, useEffect } from 'react';
import type { AgentRole } from '@/shared/types';
import type { PromptTemplate } from '../types';
import { AGENT_ROLE_META } from '../types';

interface AgentRoleEditorProps {
  role: AgentRole;
  template: PromptTemplate | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (role: AgentRole, systemPrompt: string) => Promise<void>;
  onPreview: (role: AgentRole) => void;
  onClose: () => void;
}

export function AgentRoleEditor({
  role,
  template,
  isLoading,
  isSaving,
  onSave,
  onPreview,
  onClose,
}: AgentRoleEditorProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const roleMeta = AGENT_ROLE_META.find((m) => m.role === role);

  useEffect(() => {
    if (template) {
      setSystemPrompt(template.systemPrompt ?? '');
      setHasChanges(false);
    }
  }, [template]);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
    setHasChanges(true);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaveError(null);
    try {
      await onSave(role, systemPrompt);
      setHasChanges(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败';
      setSaveError(message);
    }
  }, [role, systemPrompt, onSave]);

  const handleReset = useCallback(() => {
    if (template) {
      setSystemPrompt(template.systemPrompt);
      setHasChanges(false);
      setSaveError(null);
    }
  }, [template]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-neon-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-2 text-sm text-slate-500">加载提示词模板...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {roleMeta?.icon ?? '🤖'}
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-200">
              {roleMeta?.label ?? role} — 提示词编辑
            </h3>
            <p className="text-xs text-slate-500">{roleMeta?.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-deep-border hover:text-slate-300"
          title="关闭"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 系统提示词编辑区 */}
      <div className="mb-4">
        <label htmlFor={`system-prompt-${role}`} className="mb-1 block text-sm font-medium text-slate-400">
          系统提示词
        </label>
        <textarea
          id={`system-prompt-${role}`}
          value={systemPrompt}
          onChange={handlePromptChange}
          rows={12}
          className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 font-mono text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue placeholder-slate-600"
          placeholder="输入系统提示词..."
        />
        <div className="mt-1 flex justify-between">
          <span className="text-xs text-slate-500">
            {systemPrompt.length} 字符
          </span>
          {template?.version !== undefined && (
            <span className="text-xs text-slate-500">版本: v{template.version}</span>
          )}
        </div>
      </div>

      {/* 保存错误 */}
      {saveError && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{saveError}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-1 rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              保存中...
            </>
          ) : (
            '保存修改'
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
          className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          重置
        </button>
        <button
          type="button"
          onClick={() => onPreview(role)}
          disabled={isSaving}
          className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          预览渲染
        </button>
      </div>
    </div>
  );
}