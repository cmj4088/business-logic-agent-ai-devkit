# m17_agent_config/hooks/useAgentConfig.ts — Agent 配置 Hook

## 概述
管理 Agent 配置状态和操作的核心 Hook，包括后端选择、模型管理、提示词模板和 API Key 的读写。提供细粒度的 setter 方法和批量更新能力。

## Hook 详细说明

### useAgentConfig()
- **功能**: 管理 Agent 配置的完整状态和操作
- **返回值**: `UseAgentConfigReturn` — 包含状态、setter 方法、刷新方法
- **状态管理**: `config` (AgentConfig), `promptTemplates`, `isLoadingTemplates`, `modelsLoading`, `loadError`
- **Setter 方法**:
  - `setBackend` — 设置 LLM 后端
  - `setOllamaUrl` — 设置 Ollama 地址
  - `setDefaultModel` — 设置默认模型
  - `setTemperature` — 设置温度参数
  - `setMaxTokens` — 设置最大 Token 数
  - `setAnthropicApiKey` — 设置 Anthropic API Key
  - `setOpenaiApiKey` — 设置 OpenAI API Key
  - `updateConfig` — 批量更新部分配置
- **刷新方法**:
  - `refreshModels` — 刷新模型列表（Ollama 后端先尝试 `fetchOllamaModels`，失败回退到 `fetchAvailableModels`）
  - `refreshTemplates` — 刷新提示词模板
- **关键逻辑**:
  - 初始加载时自动获取模板和模型列表
  - 使用 `initialLoadDone` ref 防止重复加载（React StrictMode 下 double-mount）
  - 模型刷新根据 `defaultBackend` 选择不同的 API

## 依赖关系
- `react`: useState, useCallback, useEffect, useRef
- `../types`: AgentConfig, LLMBackend, ModelInfo, PromptTemplate, DEFAULT_AGENT_CONFIG
- `../api`: fetchPromptTemplates, fetchAvailableModels, fetchOllamaModels

## 注意事项
- 所有 setter 使用 `useCallback` 包裹，避免子组件不必要的重渲染
- API Key 暂时存储在组件状态中（非持久化），后续需要加密存储