/**
 * Business Logic Agent 前端常量定义。
 *
 * 包含 IPD 阶段、Agent 角色、门禁、复杂度级别等
 * 对应的中文标签和颜色映射。
 */

import type { IPDStage, AgentRole, ComplexityTier } from './types';

/** IPD 六个阶段列表 */
export const IPD_STAGES: IPDStage[] = [
  'concept',
  'plan',
  'develop',
  'verify',
  'launch',
  'lifecycle',
];

/** IPD 阶段中文标签 */
export const IPD_STAGE_LABELS: Record<IPDStage, string> = {
  concept: '概念',
  plan: '计划',
  develop: '开发',
  verify: '验证',
  launch: '发布',
  lifecycle: '生命周期',
};

/** 六个 Agent 角色列表 */
export const AGENT_ROLES: AgentRole[] = [
  'product_manager',
  'rd',
  'qa',
  'marketing',
  'manufacturing',
  'finance',
];

/** Agent 角色中文标签 */
export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  product_manager: '产品经理',
  rd: '研发架构师',
  qa: '测试专家',
  marketing: '市场专家',
  manufacturing: '制造工程师',
  finance: '财务分析师',
};

/** IPD 门禁列表 */
export const GATES = [
  'CDCP',
  'PDCP',
  'TR3',
  'TR4',
  'TR5',
  'TR6',
  'ADCP',
  'LDCP',
] as const;

/** 复杂度级别中文标签 */
export const COMPLEXITY_TIER_LABELS: Record<ComplexityTier, string> = {
  auto: '自动',
  lite: '轻量',
  standard: '标准',
  full: '完整',
};

/** 行业选项 */
export const INDUSTRY_OPTIONS = [
  '消费电子',
  '医疗器械',
  '汽车电子',
  '航空',
  '软件',
  '其他',
] as const;

/** 项目状态对应的颜色 */
export const STATUS_COLORS = {
  active: 'green',
  paused: 'yellow',
  completed: 'gray',
  archived: 'gray',
} as const;

/** AI 可信度级别对应的颜色图标 */
export const CONFIDENCE_COLORS = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
} as const;