/** M17 Agent 配置模块 — API 调用 */

import { get, post, put } from '@/shared/api-client';
import type { PluginInfo } from '@/m19_plugin_management/types';
import type {
  ModelInfo,
  ModelTestRequest,
  ModelTestResponse,
  PromptPreviewRequest,
  PromptPreviewResponse,
  PromptTemplate,
  UpdatePromptTemplateRequest,
} from './types';

/** 获取所有提示词模板 */
export async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  const list = await get<Array<{ role: string; name: string; has_custom: boolean }>>('/api/prompts/templates');
  // 逐一获取每个角色的模板详情（含 systemPrompt 内容）
  const details = await Promise.all(
    list.map(async (item) => {
      try {
        const detail = await get<{ role: string; name: string; content: string; version: string; updated_at: string }>(
          `/api/prompts/templates/${item.role}`,
        );
        return {
          role: item.role as PromptTemplate['role'],
          systemPrompt: detail.content ?? '',
          userPromptTemplate: '',
          version: parseInt(detail.version || '1', 10),
          updatedAt: detail.updated_at || undefined,
        };
      } catch {
        return {
          role: item.role as PromptTemplate['role'],
          systemPrompt: '',
          userPromptTemplate: '',
          version: 1,
        };
      }
    }),
  );
  return details;
}

/** 获取特定角色提示词模板 */
export async function fetchPromptTemplateByRole(role: string): Promise<PromptTemplate> {
  const detail = await get<{ role: string; name: string; content: string; version: string; updated_at: string }>(
    `/api/prompts/templates/${role}`,
  );
  return {
    role: role as PromptTemplate['role'],
    systemPrompt: detail.content ?? '',
    userPromptTemplate: '',
    version: parseInt(detail.version || '1', 10),
    updatedAt: detail.updated_at || undefined,
  };
}

/** 更新提示词模板 */
export async function updatePromptTemplate(
  role: string,
  data: UpdatePromptTemplateRequest,
): Promise<PromptTemplate> {
  const result = await put<{ role: string; name: string; content: string; version: string; updated_at: string }>(
    `/api/prompts/templates/${role}`,
    { content: data.systemPrompt, version: '1.0' },
  );
  return {
    role: role as PromptTemplate['role'],
    systemPrompt: result.content ?? '',
    userPromptTemplate: '',
    version: parseInt(result.version || '1', 10),
    updatedAt: result.updated_at || undefined,
  };
}

/** 预览渲染后的提示词 */
export async function previewPrompt(data: PromptPreviewRequest): Promise<PromptPreviewResponse> {
  return post<PromptPreviewResponse>('/api/prompts/preview', data);
}

/** 测试 LLM 连接 */
export async function testModelConnection(data: ModelTestRequest): Promise<ModelTestResponse> {
  return post<ModelTestResponse>('/api/agents/test', data);
}

/** 获取可用模型列表 */
export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  return get<ModelInfo[]>('/api/agents/models');
}

/** 获取 Ollama 可用模型列表 */
export async function fetchOllamaModels(ollamaUrl: string): Promise<ModelInfo[]> {
  return get<ModelInfo[]>(`/api/agents/models?ollama_url=${encodeURIComponent(ollamaUrl)}`);
}

/** 保存 API Key（加密存储） */
export async function saveApiKey(backend: string, apiKey: string): Promise<void> {
  return post<void>('/api/agents/api-keys', { backend, api_key: apiKey });
}

/** 获取 API Key 状态（是否已配置） */
export async function getApiKeyStatus(): Promise<Record<string, boolean>> {
  return get<Record<string, boolean>>('/api/agents/api-keys/status');
}

/** 获取指定 Agent 角色已分配的插件列表 */
export async function fetchAgentPlugins(agentRole: string): Promise<PluginInfo[]> {
  return get<PluginInfo[]>(`/api/plugins/agent/${agentRole}`);
}

/** 设置指定 Agent 角色的插件分配 */
export async function setAgentPlugins(
  agentRole: string,
  pluginIds: string[],
): Promise<PluginInfo[]> {
  return post<PluginInfo[]>(`/api/plugins/agent/${agentRole}`, {
    plugin_ids: pluginIds,
  });
}