/** M17 提示词预览 — 渲染预览系统提示词 */

import { useState, useCallback } from 'react';
import type { AgentRole } from '@/shared/types';
import type { PromptPreviewResponse } from '../types';
import { previewPrompt } from '../api';
import { AGENT_ROLE_META } from '../types';

interface PromptPreviewProps {
  role: AgentRole;
  systemPrompt: string;
  projectContext?: Record<string, string>;
  stageContext?: string;
  onClose: () => void;
}

export function PromptPreview({
  role,
  systemPrompt,
  projectContext,
  stageContext,
  onClose,
}: PromptPreviewProps) {
  const [preview, setPreview] = useState<PromptPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleMeta = AGENT_ROLE_META.find((m) => m.role === role);

  const handlePreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const result = await previewPrompt({
        role,
        systemPrompt,
        projectContext,
        stageContext,
      });
      setPreview(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '预览失败';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [role, systemPrompt, projectContext, stageContext]);

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
              {roleMeta?.label ?? role} — 提示词预览
            </h3>
            <p className="text-xs text-slate-500">渲染后的完整系统提示词</p>
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

      {/* 渲染按钮 */}
      {!preview && !isLoading && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!systemPrompt}
            className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            渲染预览
          </button>
          {!systemPrompt && (
            <p className="mt-2 text-xs text-slate-500">请先编辑系统提示词后再预览</p>
          )}
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-neon-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="ml-2 text-sm text-slate-500">正在渲染提示词...</span>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 渲染结果 */}
      {preview && (
        <div className="space-y-4">
          {/* Token 统计 */}
          <div className="flex items-center gap-4 rounded-lg bg-deep-surface px-4 py-2">
            <span className="text-xs text-slate-500">
              Token 数: <span className="font-medium text-slate-300">{preview.tokenCount}</span>
            </span>
          </div>

          {/* 渲染后的系统提示词 */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-400">系统提示词</h4>
            <pre className="max-h-64 overflow-auto rounded-lg border border-deep-border bg-deep-surface p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {preview.renderedSystemPrompt}
            </pre>
          </div>

          {/* 渲染后的用户提示词 */}
          {preview.renderedUserPrompt && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-400">用户提示词模板</h4>
              <pre className="max-h-64 overflow-auto rounded-lg border border-deep-border bg-deep-surface p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {preview.renderedUserPrompt}
              </pre>
            </div>
          )}

          {/* 重新渲染 */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={isLoading}
            className="rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            重新渲染
          </button>
        </div>
      )}
    </div>
  );
}