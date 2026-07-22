/** M17 API Key 配置面板 — DeepSeek / Anthropic / OpenAI API Key 管理 */

import { useState, useCallback } from 'react';
import type { LLMBackend } from '../types';
import { DataExportNotice } from './DataExportNotice';
import { useModelTest } from '../hooks/useModelTest';
import { saveApiKey } from '../api';

interface ApiKeyConfigProps {
  deepseekApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  defaultBackend: LLMBackend;
  onDeepseekKeyChange: (key: string) => void;
  onAnthropicKeyChange: (key: string) => void;
  onOpenaiKeyChange: (key: string) => void;
  disabled?: boolean;
}

type CloudBackend = 'deepseek' | 'anthropic' | 'openai';

export function ApiKeyConfig({
  deepseekApiKey,
  anthropicApiKey,
  openaiApiKey,
  defaultBackend,
  onDeepseekKeyChange,
  onAnthropicKeyChange,
  onOpenaiKeyChange,
  disabled = false,
}: ApiKeyConfigProps) {
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [pendingBackend, setPendingBackend] = useState<CloudBackend | null>(null);
  const [pendingAction, setPendingAction] = useState<'test' | 'save' | null>(null);
  const [showDataNotice, setShowDataNotice] = useState(false);

  const { isTesting, testResult, testError, runTest, clearResult } = useModelTest();

  const getApiKey = useCallback((backend: CloudBackend): string => {
    if (backend === 'deepseek') return deepseekApiKey;
    if (backend === 'anthropic') return anthropicApiKey;
    return openaiApiKey;
  }, [deepseekApiKey, anthropicApiKey, openaiApiKey]);

  const handleDataNoticeAgree = useCallback(() => {
    setShowDataNotice(false);
    if (pendingAction === 'test' && pendingBackend) {
      const apiKey = getApiKey(pendingBackend);
      // 先保存 Key 到数据库，再测试连接
      void (async () => {
        try {
          await saveApiKey(pendingBackend, apiKey);
          const modelMap: Record<CloudBackend, string> = {
            deepseek: 'deepseek-chat',
            anthropic: 'claude-sonnet-4-5',
            openai: 'gpt-4o',
          };
          await runTest({
            backend: pendingBackend,
            model: modelMap[pendingBackend],
          });
        } catch (err) {
          // saveApiKey 或 runTest 失败时，useModelTest 内部已处理 testError
        }
      })();
    }
    setPendingBackend(null);
    setPendingAction(null);
  }, [pendingAction, pendingBackend, getApiKey, runTest]);

  const handleDataNoticeDisagree = useCallback(() => {
    setShowDataNotice(false);
    setPendingBackend(null);
    setPendingAction(null);
  }, []);

  const handleTest = useCallback(
    (backend: CloudBackend) => {
      const apiKey = getApiKey(backend);
      if (!apiKey) {
        clearResult();
        return;
      }
      setPendingBackend(backend);
      setPendingAction('test');
      setShowDataNotice(true);
    },
    [getApiKey, clearResult],
  );

  const maskApiKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
  };

  const isCloud = defaultBackend === 'deepseek' || defaultBackend === 'anthropic' || defaultBackend === 'openai';

  return (
    <div className="rounded-xl border border-deep-border bg-deep-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-200">云端 API（高级选项）</h3>
        {!isCloud && (
          <span className="rounded-full bg-deep-surface px-2 py-0.5 text-xs text-slate-500">未启用</span>
        )}
      </div>

      {/* DeepSeek API Key */}
      <div className="mb-4">
        <label htmlFor="deepseek-api-key" className="mb-1 block text-sm font-medium text-slate-400">
          DeepSeek API Key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="deepseek-api-key"
              type={showDeepseek ? 'text' : 'password'}
              value={deepseekApiKey}
              onChange={(e) => onDeepseekKeyChange(e.target.value)}
              placeholder="sk-..."
              disabled={disabled}
              className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 pr-10 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue placeholder-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowDeepseek((v) => !v)}
              disabled={disabled || !deepseekApiKey}
              title={showDeepseek ? '隐藏' : '显示'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {showDeepseek ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 01-3 3m8.5 4.5L19 18m-2 2l-2-2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleTest('deepseek')}
            disabled={disabled || !deepseekApiKey || isTesting}
            className="inline-flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting && pendingBackend === 'deepseek' ? '测试中...' : '测试'}
          </button>
        </div>
        {deepseekApiKey && !showDeepseek && (
          <p className="mt-1 text-xs text-slate-500">{maskApiKey(deepseekApiKey)}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          获取地址：platform.deepseek.com → API Keys
        </p>
      </div>

      {/* Anthropic API Key */}
      <div className="mb-4">
        <label htmlFor="anthropic-api-key" className="mb-1 block text-sm font-medium text-slate-400">
          Anthropic API Key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="anthropic-api-key"
              type={showAnthropic ? 'text' : 'password'}
              value={anthropicApiKey}
              onChange={(e) => onAnthropicKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              disabled={disabled}
              className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 pr-10 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue placeholder-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowAnthropic((v) => !v)}
              disabled={disabled || !anthropicApiKey}
              title={showAnthropic ? '隐藏' : '显示'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {showAnthropic ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 01-3 3m8.5 4.5L19 18m-2 2l-2-2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleTest('anthropic')}
            disabled={disabled || !anthropicApiKey || isTesting}
            className="inline-flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting && pendingBackend === 'anthropic' ? '测试中...' : '测试'}
          </button>
        </div>
        {anthropicApiKey && !showAnthropic && (
          <p className="mt-1 text-xs text-slate-500">{maskApiKey(anthropicApiKey)}</p>
        )}
      </div>

      {/* OpenAI API Key */}
      <div className="mb-4">
        <label htmlFor="openai-api-key" className="mb-1 block text-sm font-medium text-slate-400">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="openai-api-key"
              type={showOpenai ? 'text' : 'password'}
              value={openaiApiKey}
              onChange={(e) => onOpenaiKeyChange(e.target.value)}
              placeholder="sk-..."
              disabled={disabled}
              className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-2 pr-10 text-sm text-slate-300 shadow-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue placeholder-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowOpenai((v) => !v)}
              disabled={disabled || !openaiApiKey}
              title={showOpenai ? '隐藏' : '显示'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {showOpenai ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 01-3 3m8.5 4.5L19 18m-2 2l-2-2" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleTest('openai')}
            disabled={disabled || !openaiApiKey || isTesting}
            className="inline-flex items-center gap-1 rounded-lg border border-deep-border bg-deep-surface px-3 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-deep-surface/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting && pendingBackend === 'openai' ? '测试中...' : '测试'}
          </button>
        </div>
        {openaiApiKey && !showOpenai && (
          <p className="mt-1 text-xs text-slate-500">{maskApiKey(openaiApiKey)}</p>
        )}
      </div>

      {/* 测试结果 */}
      {(testResult || testError) && (
        <div
          className={`mb-4 rounded-lg border p-3 ${
            testResult?.success
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={testResult?.success ? 'text-green-400' : 'text-red-400'}>
              {testResult?.success ? '✓' : '✗'}
            </span>
            <span className={`text-sm font-medium ${testResult?.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult?.success ? '连接测试成功' : '连接测试失败'}
            </span>
          </div>
          {testResult && (
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              {testResult.latencyMs > 0 && <p>延迟: {testResult.latencyMs}ms</p>}
              {testResult.tokenCount > 0 && <p>Token 数: {testResult.tokenCount}</p>}
              <p>模型: {testResult.modelUsed}</p>
              {testResult.error && <p className="text-red-400">{testResult.error}</p>}
            </div>
          )}
          {testError && !testResult && <p className="mt-1 text-xs text-red-400">{testError}</p>}
        </div>
      )}

      {/* 数据出境提醒 */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-amber-400">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-300">
              使用云端 API 意味着数据将被发送到境外服务器。
            </p>
            <p className="mt-1 text-xs text-amber-400">
              请在输入 API Key 后点击"测试"按钮，系统将弹出数据出境告知。
            </p>
          </div>
        </div>
      </div>

      {/* 数据出境告知弹窗 */}
      {pendingBackend && (
        <DataExportNotice
          isOpen={showDataNotice}
          backend={pendingBackend}
          onAgree={handleDataNoticeAgree}
          onDisagree={handleDataNoticeDisagree}
          onClose={() => setShowDataNotice(false)}
        />
      )}
    </div>
  );
}