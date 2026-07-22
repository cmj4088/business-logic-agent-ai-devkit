/** M17 模型连接测试面板 — 测试 LLM 连接状态 */

import type { LLMBackend } from '../types';
import { useModelTest } from '../hooks/useModelTest';

interface ModelTestPanelProps {
  backend: LLMBackend;
  model?: string;
  ollamaUrl?: string;
  apiKey?: string;
  disabled?: boolean;
}

export function ModelTestPanel({
  backend,
  model,
  ollamaUrl,
  apiKey,
  disabled = false,
}: ModelTestPanelProps) {
  const { isTesting, testResult, testError, runTest, clearResult } = useModelTest();

  const handleTest = () => {
    void runTest({ backend, model, ollamaUrl, apiKey });
  };

  const isOllamaUnavailable = backend === 'ollama' && !ollamaUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={disabled || isTesting || isOllamaUnavailable}
          className="inline-flex items-center gap-2 rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              测试中...
            </>
          ) : (
            '测试连接'
          )}
        </button>

        {testResult && (
          <button
            type="button"
            onClick={clearResult}
            className="text-sm text-slate-500 underline transition-colors hover:text-slate-300"
          >
            清除结果
          </button>
        )}
      </div>

      {isOllamaUnavailable && (
        <p className="text-sm text-amber-400">
          请先配置 Ollama 服务地址后再测试
        </p>
      )}

      {/* 测试结果 */}
      {testResult && (
        <div
          className={`rounded-lg border p-4 ${
            testResult.success
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            {testResult.success ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                ✓
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                ✗
              </span>
            )}
            <span className={`text-sm font-semibold ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? '连接成功' : '连接失败'}
            </span>
          </div>

          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">延迟</dt>
              <dd className="font-medium text-slate-300">{testResult.latencyMs}ms</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Token 数</dt>
              <dd className="font-medium text-slate-300">{testResult.tokenCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">模型</dt>
              <dd className="font-medium text-slate-300 truncate">{testResult.modelUsed}</dd>
            </div>
          </dl>

          {testResult.error && (
            <p className="mt-2 text-sm text-red-400">{testResult.error}</p>
          )}
        </div>
      )}

      {testError && !testResult && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{testError}</p>
        </div>
      )}
    </div>
  );
}