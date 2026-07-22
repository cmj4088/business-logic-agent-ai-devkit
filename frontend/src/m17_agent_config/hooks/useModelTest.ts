/** M17 模型测试 Hook — 管理 LLM 连接测试 */

import { useState, useCallback } from 'react';
import type { LLMBackend, ModelTestResponse } from '../types';
import { testModelConnection } from '../api';

export interface UseModelTestReturn {
  isTesting: boolean;
  testResult: ModelTestResponse | null;
  testError: string | null;
  runTest: (params: {
    backend: LLMBackend;
    model?: string;
    ollamaUrl?: string;
    apiKey?: string;
  }) => Promise<void>;
  clearResult: () => void;
}

export function useModelTest(): UseModelTestReturn {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ModelTestResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = useCallback(
    async (params: {
      backend: LLMBackend;
      model?: string;
      ollamaUrl?: string;
      apiKey?: string;
    }) => {
      setIsTesting(true);
      setTestResult(null);
      setTestError(null);

      try {
        const result = await testModelConnection({
          backend: params.backend,
          model: params.model,
          ollamaUrl: params.ollamaUrl,
          apiKey: params.apiKey,
        });
        setTestResult(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '模型连接测试失败';
        setTestError(message);
        setTestResult({
          success: false,
          latencyMs: 0,
          tokenCount: 0,
          modelUsed: params.model ?? 'unknown',
          error: message,
        });
      } finally {
        setIsTesting(false);
      }
    },
    [],
  );

  const clearResult = useCallback(() => {
    setTestResult(null);
    setTestError(null);
  }, []);

  return {
    isTesting,
    testResult,
    testError,
    runTest,
    clearResult,
  };
}