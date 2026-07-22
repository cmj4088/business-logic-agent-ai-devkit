/** M18 用量与设置模块 — API 调用层 */

import { get, post, put } from '@/shared/api-client';
import type {
  UsageOverview,
  ProjectUsageItem,
  DailyTrendItem,
  UsageLimits,
  BudgetAlerts,
  GlobalSettings,
  ExportRequest,
  ClearDataRequest,
} from './types';

/** 获取用量概览 */
export async function fetchUsageOverviewAPI(): Promise<UsageOverview> {
  const data = await get<{
    total_tokens: number;
    total_cost: number;
    total_records: number;
    active_projects: number;
    period?: string;
  }>('/api/usage/overview');
  return {
    total_tokens: data.total_tokens ?? 0,
    total_cost: data.total_cost ?? 0,
    total_calls: data.total_records ?? 0,
    active_projects: data.active_projects ?? 0,
    model_distribution: [],
  };
}

/** 获取项目用量明细 */
export async function fetchProjectUsageAPI(): Promise<ProjectUsageItem[]> {
  const data = await get<Array<{
    projectId: string;
    projectName: string;
    totalTokens: number;
    totalCostUSD: number;
  }>>('/api/usage/projects');
  return (data ?? []).map((item) => ({
    project_id: item.projectId,
    project_name: item.projectName,
    total_tokens: item.totalTokens ?? 0,
    total_cost: item.totalCostUSD ?? 0,
    call_count: 0,
    model_breakdown: [],
  }));
}

/** 获取每日趋势 */
export async function fetchDailyTrendsAPI(): Promise<DailyTrendItem[]> {
  const data = await get<Array<{
    date: string;
    total_tokens: number;
    total_input_tokens?: number;
    total_output_tokens?: number;
    total_cost?: number;
    record_count?: number;
  }>>('/api/usage/daily-trends');
  return (data ?? []).map((item) => ({
    date: item.date,
    total_tokens: item.total_tokens ?? 0,
    model_breakdown: {},
  }));
}

/** 获取用量限制 */
export async function fetchUsageLimitsAPI(): Promise<UsageLimits> {
  const data = await get<{ limits: Array<{ limit_type: string; max_tokens: number; period: string; is_active: boolean }> }>('/api/usage/limits');
  const limits = data.limits ?? [];
  const daily = limits.find((l) => l.period === 'daily');
  const monthly = limits.find((l) => l.period === 'monthly');
  return {
    daily_limit: daily?.max_tokens ?? 100000,
    daily_enabled: daily?.is_active ?? false,
    monthly_limit: monthly?.max_tokens ?? 1000000,
    monthly_enabled: monthly?.is_active ?? false,
  };
}

/** 更新用量限制 */
export async function updateUsageLimitsAPI(data: UsageLimits): Promise<UsageLimits> {
  return put<UsageLimits>('/api/usage/limits', data);
}

/** 获取预算预警 */
export async function fetchBudgetAlertsAPI(): Promise<BudgetAlerts> {
  const data = await get<{
    dailyLimit?: number;
    monthlyLimit?: number;
    alertThreshold?: number;
    isEnabled?: boolean;
  }>('/api/usage/budget-alerts');
  return {
    threshold_percent: Math.round((data.alertThreshold ?? 0.8) * 100),
    enabled: data.isEnabled ?? false,
  };
}

/** 更新预算预警 */
export async function updateBudgetAlertsAPI(data: BudgetAlerts): Promise<BudgetAlerts> {
  return put<BudgetAlerts>('/api/usage/budget-alerts', data);
}

/** 获取全局设置 */
export async function fetchSettingsAPI(): Promise<GlobalSettings> {
  const data = await get<{
    theme: string;
    language: string;
    autoAdvanceStage?: boolean;
    maxDebateRounds?: number;
    notificationEnabled?: boolean;
    defaultLLMBackend?: string;
  }>('/api/settings');
  return {
    language: (data.language as GlobalSettings['language']) ?? 'zh-CN',
    theme: (data.theme as GlobalSettings['theme']) ?? 'system',
    notifications: {
      gate_ready: data.notificationEnabled ?? true,
      stage_complete: data.notificationEnabled ?? true,
      budget_warning: data.notificationEnabled ?? true,
    },
  };
}

/** 更新全局设置 */
export async function updateSettingsAPI(data: GlobalSettings): Promise<GlobalSettings> {
  const result = await put<{
    theme: string;
    language: string;
    notificationEnabled: boolean;
  }>('/api/settings', {
    theme: data.theme,
    language: data.language,
    notificationEnabled: data.notifications?.gate_ready ?? true,
  });
  return {
    language: (result.language as GlobalSettings['language']) ?? 'zh-CN',
    theme: (result.theme as GlobalSettings['theme']) ?? 'system',
    notifications: {
      gate_ready: result.notificationEnabled ?? true,
      stage_complete: result.notificationEnabled ?? true,
      budget_warning: result.notificationEnabled ?? true,
    },
  };
}

/** 导出数据 */
export async function exportDataAPI(): Promise<Blob> {
  const data: ExportRequest = { format: 'json' };
  return post<Blob>('/api/data/export', data);
}

/** 清除所有数据 */
export async function clearDataAPI(confirmation: string): Promise<{ success: boolean }> {
  const data: ClearDataRequest = { confirmation };
  return post<{ success: boolean }>('/api/data/clear', data);
}