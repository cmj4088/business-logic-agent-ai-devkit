/** M17 Agent 配置 Hook — 管理 Agent 配置状态和操作 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AgentConfig, LLMBackend, ModelInfo, PromptTemplate } from '../types';
import { DEFAULT_AGENT_CONFIG } from '../types';
import { fetchPromptTemplates, fetchAvailableModels, fetchOllamaModels } from '../api';

export interface UseAgentConfigReturn {
  config: AgentConfig;
  promptTemplates: PromptTemplate[];
  isLoadingTemplates: boolean;
  modelsLoading: boolean;
  loadError: string | null;
  setBackend: (backend: LLMBackend) => void;
  setOllamaUrl: (url: string) => void;
  setDefaultModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setAnthropicApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setDeepseekApiKey: (key: string) => void;
  refreshModels: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  updateConfig: (partial: Partial<AgentConfig>) => void;
}

export function useAgentConfig(): UseAgentConfigReturn {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const updateConfig = useCallback((partial: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const setBackend = useCallback((backend: LLMBackend) => {
    setConfig((prev) => ({ ...prev, defaultBackend: backend }));
  }, []);

  const setOllamaUrl = useCallback((url: string) => {
    setConfig((prev) => ({ ...prev, ollamaUrl: url }));
  }, []);

  const setDefaultModel = useCallback((model: string) => {
    setConfig((prev) => ({ ...prev, defaultModel: model }));
  }, []);

  const setTemperature = useCallback((temp: number) => {
    setConfig((prev) => ({ ...prev, temperature: temp }));
  }, []);

  const setMaxTokens = useCallback((tokens: number) => {
    setConfig((prev) => ({ ...prev, maxTokens: tokens }));
  }, []);

  const setAnthropicApiKey = useCallback((key: string) => {
    setConfig((prev) => ({ ...prev, anthropicApiKey: key }));
  }, []);

  const setOpenaiApiKey = useCallback((key: string) => {
    setConfig((prev) => ({ ...prev, openaiApiKey: key }));
  }, []);

  const setDeepseekApiKey = useCallback((key: string) => {
    setConfig((prev) => ({ ...prev, deepseekApiKey: key }));
  }, []);

  /** 刷新模型列表 */
  const refreshModels = useCallback(async () => {
    setModelsLoading(true);
    setLoadError(null);
    try {
      let models: ModelInfo[];
      if (config.defaultBackend === 'ollama') {
        try {
          models = await fetchOllamaModels(config.ollamaUrl);
        } catch {
          // 回退到通用模型列表接口
          models = await fetchAvailableModels();
        }
      } else {
        models = await fetchAvailableModels();
      }
      setConfig((prev) => ({ ...prev, availableModels: models }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取模型列表失败';
      setLoadError(message);
    } finally {
      setModelsLoading(false);
    }
  }, [config.ollamaUrl, config.defaultBackend]);

  /** 刷新提示词模板 */
  const refreshTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    setLoadError(null);
    try {
      const templates = await fetchPromptTemplates();
      setPromptTemplates(templates);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取提示词模板失败';
      setLoadError(message);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    void refreshTemplates();
    void refreshModels();
  }, [refreshTemplates, refreshModels]);

  return {
    config,
    promptTemplates,
    isLoadingTemplates,
    modelsLoading,
    loadError,
    setBackend,
    setOllamaUrl,
    setDefaultModel,
    setTemperature,
    setMaxTokens,
    setAnthropicApiKey,
    setOpenaiApiKey,
    setDeepseekApiKey,
    refreshModels,
    refreshTemplates,
    updateConfig,
  };
}