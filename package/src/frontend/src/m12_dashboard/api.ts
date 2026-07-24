/** M12 Dashboard 模块 — API 调用层 */

import { get } from '@/shared/api-client';
import type { DashboardData } from './types';

/** 获取 Dashboard 聚合数据 */
export async function fetchDashboardAPI(): Promise<DashboardData> {
  return get<DashboardData>('/api/dashboard');
}