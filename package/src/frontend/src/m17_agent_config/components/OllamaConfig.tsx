/** M17 Ollama 连接配置 — 配置 Ollama 服务地址和模型 */

import { useState, useCallback } from 'react';
import type { ModelInfo } from '../types';

interface OllamaConfigProps {
  ollamaUrl: string;
  defaultModel: string;
  availableModels: ModelInfo[];
  modelsLoading: boolean;
  onUrlChange: (url: string) => void;
  onModelChange: (model: string) => void;
  onRefreshModels: () => void;
  disabled?: boolean;
}

export function OllamaConfig({
  ollamaUrl,
  defaultModel,
  availableModels = [],
  modelsLoading,
  onUrlChange,
  onModelChange,
  onRefreshModels,
  disabled = false,
}: OllamaConfigProps) {
  const [localUrl, setLocalUrl] = useState(ollamaUrl);

  // 确保 availableModels 是数组
  const models = Array.isArray(availableModels) ? availableModels : [];

  const handleUrlBlur = useCallback(() => {
    if (localUrl !== ollamaUrl) {
      onUrlChange(localUrl);
    }
  }, [localUrl, ollamaUrl, onUrlChange]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && localUrl !== ollamaUrl) {
        onUrlChange(localUrl);
      }
    },
    [localUrl, ollamaUrl, onUrlChange],
  );

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-200">Ollama 连接配置</h3>

      {/* Ollama 服务地址 */}
      <div className="mb-4">
        <label htmlFor="ollama-url" className="mb-1 block text-sm font-medium text-slate-400">
          Ollama 服务地址
        </label>
        <div className="flex gap-2">
          <input
            id="ollama-url"
            type="text"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            onBlur={handleUrlBlur}
            onKeyDown={handleUrlKeyDown}
            placeholder="http://localhost:11434"
            disabled={disabled}
            className="flex-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue placeholder-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onRefreshModels}
            disabled={disabled || modelsLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {modelsLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                加载中...
              </>
            ) : (
              '刷新'
            )}
          </button>
        </div>
      </div>

      {/* 可用模型列表 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-400">可用模型</label>
        {modelsLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            正在获取模型列表...
          </div>
        ) : models.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">
            暂无可用模型，请确保 Ollama 服务已启动并点击"刷新"
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-lg border border-deep-border bg-deep-surface p-3">
            {models.map((model) => (
              <span
                key={model.name}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  defaultModel === model.name
                    ? 'bg-neon-blue/15 text-neon-blue ring-1 ring-neon-blue/50'
                    : 'bg-deep-surface text-slate-400 ring-1 ring-deep-border'
                }`}
              >
                {model.name}
                {model.size && (
                  <span className="ml-1 text-slate-500">({model.size})</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 默认模型选择 */}
      <div>
        <label htmlFor="default-model" className="mb-1 block text-sm font-medium text-slate-400">
          默认模型
        </label>
        <select
          id="default-model"
          value={defaultModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled || models.length === 0}
          className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {models.length === 0 ? (
            <option value="">请先刷新模型列表</option>
          ) : (
            models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}