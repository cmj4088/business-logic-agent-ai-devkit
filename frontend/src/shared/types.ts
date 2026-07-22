/** Business Logic Agent 共享类型定义
 *
 * 包含 IPD 阶段、Agent 角色、编排模式、复杂度级别等枚举类型。
 */

/** IPD 产品开发阶段（6 个阶段） */
export type IPDStage = 'concept' | 'plan' | 'develop' | 'verify' | 'launch' | 'lifecycle';

/** Agent 角色定义（6 个角色） */
export type AgentRole =
  | 'product_manager'
  | 'rd'
  | 'qa'
  | 'marketing'
  | 'manufacturing'
  | 'finance';

/** Agent 编排模式 */
export type OrchestrationMode = 'parallel' | 'sequential' | 'debate';

/** 项目复杂度级别 */
export type ComplexityTier = 'auto' | 'lite' | 'standard' | 'full';

/** IPD 阶段信息 */
export interface StageInfo {
  stage: IPDStage;
  label: string;
  description: string;
}

/** Agent 角色信息 */
export interface AgentRoleInfo {
  role: AgentRole;
  label: string;
  description: string;
}

/** 门禁定义 */
export interface GateInfo {
  name: string;
  stage: IPDStage;
  label: string;
  description: string;
}

/** 项目基本信息 */
export interface Project {
  id: string;
  name: string;
  description: string;
  complexity: ComplexityTier;
  currentStage: IPDStage;
  createdAt: string;
  updatedAt: string;
}

/** API 响应包装 */
export interface ApiResponse<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  } | null;
  meta?: {
    request_id?: string;
  };
  message?: string;
  success?: boolean;
}

/** 分页参数 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// 自定义模板系统类型
// ============================================================

/** 模板来源 */
export type TemplateSource = 'builtin' | 'custom';

/** 模板分类 */
export type TemplateCategory = 'product_rd' | 'software' | 'medical' | 'marketing' | 'content' | 'custom';

/** 模板摘要（列表展示用） */
export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;
  stageCount: number;
  activityCount: number;
  roleCount: number;
  icon: string;
  createdAt: string;
  isBuiltin: boolean;
}

/** 模板阶段 */
export interface TemplateStage {
  id: string;
  name: string;
  order: number;
  description: string;
  color: string;
}

/** 模板门禁 */
export interface TemplateGate {
  id: string;
  name: string;
  stageId: string;
  description: string;
  requiredRoles: string[];
}

/** 模板角色 */
export interface TemplateRole {
  id: string;
  name: string;
  label: string;
  responsibilities: string[];
}

/** 模板活动 */
export interface TemplateActivity {
  id: string;
  name: string;
  stageId: string;
  assignedRole: string;
  description: string;
  artifactType: string;
}

/** 模板产出物 */
export interface TemplateArtifact {
  id: string;
  name: string;
  type: string;
  stageId: string;
  description: string;
}

/** 模板详情（编辑器用） */
export interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;
  stages: TemplateStage[];
  gates: TemplateGate[];
  roles: TemplateRole[];
  activities: TemplateActivity[];
  artifacts: TemplateArtifact[];
  createdAt: string;
  updatedAt: string;
}