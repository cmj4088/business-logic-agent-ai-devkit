/** Business Logic Agent 全局常量
 *
 * 定义 IPD 阶段列表、Agent 角色列表、门禁列表、复杂度活动数等常量。
 */

import type { AgentRole, ComplexityTier, IPDStage } from './types';

// IPD 6 阶段（lite 模式）
export const IPD_STAGES: IPDStage[] = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];

// 6 个 Agent 角色
export const AGENT_ROLES: AgentRole[] = ['product_manager', 'rd', 'qa', 'marketing', 'manufacturing', 'finance'];

// 门禁列表
export const GATES: string[] = ['CDCP', 'PDCP', 'TR3', 'TR4', 'TR5', 'TR6', 'ADCP', 'LDCP'];

// 复杂度对应活动数
export const COMPLEXITY_ACTIVITY_COUNTS: Record<ComplexityTier, number> = {
  auto: 0,
  lite: 24,
  standard: 31,
  full: 34,
};

// 错误码前缀
export const ERROR_PREFIXES: string[] = [
  'VALIDATION_',
  'NOT_FOUND',
  'FORBIDDEN_',
  'CONFLICT_',
  'LLM_',
  'AUTH_',
  'INTERNAL_',
];

// API 基础路径
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API 端点
export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  STAGES: '/api/stages',
  TASKS: '/api/tasks',
  AGENTS: '/api/agents',
  WORKFLOW: '/api/workflow',
} as const;

// 行业选项
export const INDUSTRY_OPTIONS = [
  { value: '消费电子', label: '消费电子' },
  { value: '医疗器械', label: '医疗器械' },
  { value: '汽车电子', label: '汽车电子' },
  { value: '航空', label: '航空' },
  { value: '软件', label: '软件' },
  { value: '其他', label: '其他' },
] as const;