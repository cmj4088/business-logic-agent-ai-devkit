/** M18 用量与设置模块 — 类型定义 */

/** 用量概览数据 */
export interface UsageOverview {
  total_tokens: number;
  total_cost: number;
  total_calls: number;
  active_projects: number;
  /** 按模型分布的用量 */
  model_distribution: ModelUsage[];
}

/** 单个模型的用量统计 */
export interface ModelUsage {
  model_name: string;
  model_label: string;
  token_count: number;
  cost: number;
  percentage: number;
  /** 是否为本地模型（如 Ollama） */
  is_local: boolean;
}

/** 项目用量明细 */
export interface ProjectUsageItem {
  project_id: string;
  project_name: string;
  total_tokens: number;
  total_cost: number;
  call_count: number;
  /** 按模型分布 */
  model_breakdown: ModelUsage[];
}

/** 每日趋势数据点 */
export interface DailyTrendItem {
  date: string;
  total_tokens: number;
  /** 按模型分组的 Token 消耗 */
  model_breakdown: Record<string, number>;
}

/** 用量限制配置 */
export interface UsageLimits {
  daily_limit: number;
  daily_enabled: boolean;
  monthly_limit: number;
  monthly_enabled: boolean;
}

/** 预算预警配置 */
export interface BudgetAlerts {
  /** 预算使用百分比阈值，达到后触发提醒 */
  threshold_percent: number;
  enabled: boolean;
}

/** 全局设置 */
export interface GlobalSettings {
  language: 'zh-CN' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

/** 通知偏好 */
export interface NotificationPreferences {
  gate_ready: boolean;
  stage_complete: boolean;
  budget_warning: boolean;
}

/** 用量数据加载状态 */
export interface UsageState {
  overview: UsageOverview | null;
  projects: ProjectUsageItem[];
  dailyTrends: DailyTrendItem[];
  limits: UsageLimits | null;
  budgetAlerts: BudgetAlerts | null;
  isLoading: boolean;
  error: string | null;
}

/** 设置数据加载状态 */
export interface SettingsState {
  settings: GlobalSettings | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

/** 导出数据请求体 */
export interface ExportRequest {
  format: 'json';
}

/** 清除数据请求体 */
export interface ClearDataRequest {
  confirmation: string;
}