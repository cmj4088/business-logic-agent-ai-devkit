/** M17 Agent 配置模块 — 类型定义 */

import type { AgentRole } from '@/shared/types';

/** LLM 后端类型 */
export type LLMBackend = 'deepseek' | 'ollama' | 'anthropic' | 'openai';

/** 模型信息 */
export interface ModelInfo {
  name: string;
  size?: string;
  modified_at?: string;
  digest?: string;
}

/** Agent 配置状态 */
export interface AgentConfig {
  defaultBackend: LLMBackend;
  ollamaUrl: string;
  defaultModel: string;
  availableModels: ModelInfo[];
  temperature: number;
  maxTokens: number;
  deepseekApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

/** 提示词模板 */
export interface PromptTemplate {
  role: AgentRole;
  systemPrompt: string;
  userPromptTemplate: string;
  updatedAt?: string;
  version?: number;
}

/** 提示词预览请求 */
export interface PromptPreviewRequest {
  role: AgentRole;
  systemPrompt: string;
  projectContext?: Record<string, string>;
  stageContext?: string;
}

/** 提示词预览响应 */
export interface PromptPreviewResponse {
  renderedSystemPrompt: string;
  renderedUserPrompt: string;
  tokenCount: number;
}

/** 模型测试请求 */
export interface ModelTestRequest {
  backend: LLMBackend;
  model?: string;
  ollamaUrl?: string;
  apiKey?: string;
}

/** 模型测试响应 */
export interface ModelTestResponse {
  success: boolean;
  latencyMs: number;
  tokenCount: number;
  modelUsed: string;
  error?: string;
}

/** 更新提示词模板请求 */
export interface UpdatePromptTemplateRequest {
  systemPrompt: string;
  userPromptTemplate?: string;
}

/** Agent 角色元数据 */
export interface AgentRoleMeta {
  role: AgentRole;
  label: string;
  icon: string;
  description: string;
}

/** 6 个 Agent 角色的中文元数据 */
export const AGENT_ROLE_META: AgentRoleMeta[] = [
  {
    role: 'product_manager',
    label: '产品经理',
    icon: '📋',
    description: '负责产品需求定义、路线图规划',
  },
  {
    role: 'rd',
    label: '研发架构师',
    icon: '💻',
    description: '负责技术方案设计、架构评审',
  },
  {
    role: 'qa',
    label: '测试专家',
    icon: '🧪',
    description: '负责测试策略、质量保障',
  },
  {
    role: 'marketing',
    label: '市场专家',
    icon: '📊',
    description: '负责市场分析、竞品调研',
  },
  {
    role: 'manufacturing',
    label: '制造工程师',
    icon: '🏭',
    description: '负责可制造性评估、工艺设计',
  },
  {
    role: 'finance',
    label: '财务分析师',
    icon: '💰',
    description: '负责成本分析、ROI 评估',
  },
];

/** 默认 Agent 配置 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  defaultBackend: 'deepseek',
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'deepseek-chat',
  availableModels: [],
  temperature: 0.7,
  maxTokens: 8192,
  deepseekApiKey: '',
  anthropicApiKey: '',
  openaiApiKey: '',
};

/** LLM 后端选项 */
export const LLM_BACKEND_OPTIONS: { value: LLMBackend; label: string; description: string }[] = [
  {
    value: 'deepseek',
    label: 'DeepSeek（云端，中文优化）',
    description: '推荐 — DeepSeek API，性价比高，中文表现优秀',
  },
  {
    value: 'ollama',
    label: 'Ollama（本地，数据不出境）',
    description: '所有数据在本地处理，无需联网',
  },
  {
    value: 'anthropic',
    label: 'Anthropic（云端）',
    description: 'Claude API，数据将发送至境外服务器',
  },
  {
    value: 'openai',
    label: 'OpenAI（云端）',
    description: 'GPT API，数据将发送至境外服务器',
  },
];