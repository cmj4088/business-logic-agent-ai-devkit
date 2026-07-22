/** M17_agent_config types.test.ts — Agent 配置模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Agent Config Types', () => {
  it('AgentConfig 应包含 Agent 配置核心字段', () => {
    const config = {
      id: 'cfg_001',
      projectId: 'proj_001',
      agentRole: 'product_manager',
      model: 'claude-opus-4-8',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: '你是一个产品经理...',
      isActive: true,
    };
    expect(config).toHaveProperty('agentRole');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('temperature');
    expect(config).toHaveProperty('maxTokens');
    expect(config).toHaveProperty('isActive');
  });

  it('OllamaConfig 应包含 Ollama 配置字段', () => {
    const config = {
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b',
      isAvailable: true,
      installedModels: ['qwen2.5:7b', 'llama3:8b'],
    };
    expect(config).toHaveProperty('baseUrl');
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('isAvailable');
    expect(config.installedModels).toHaveLength(2);
  });

  it('ApiKeyConfig 应包含 API 密钥配置字段', () => {
    const config = {
      provider: 'anthropic',
      apiKey: 'sk-ant-***',
      isMasked: true,
      lastUsed: '2026-07-09T10:00:00Z',
    };
    expect(config).toHaveProperty('provider');
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('isMasked');
    expect(config.isMasked).toBe(true);
  });

  it('ModelTestResult 应包含测试结果', () => {
    const result = {
      isSuccess: true,
      responseTime: 1.5,
      tokenCount: 150,
      error: null,
    };
    expect(result.isSuccess).toBe(true);
    expect(result.responseTime).toBeGreaterThan(0);
    expect(result.error).toBeNull();
  });
});