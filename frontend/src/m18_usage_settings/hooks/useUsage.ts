/** M18 用量与设置模块 — 用量数据 Hook */

import { useState, useEffect, useCallback } from 'react';
import type { UsageState, UsageLimits, BudgetAlerts } from '../types';
import {
  fetchUsageOverviewAPI,
  fetchProjectUsageAPI,
  fetchDailyTrendsAPI,
  fetchUsageLimitsAPI,
  updateUsageLimitsAPI,
  fetchBudgetAlertsAPI,
  updateBudgetAlertsAPI,
} from '../api';

const initialState: UsageState = {
  overview: null,
  projects: [],
  dailyTrends: [],
  limits: null,
  budgetAlerts: null,
  isLoading: true,
  error: null,
};

export function useUsage() {
  const [state, setState] = useState<UsageState>(initialState);

  const loadAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [overview, projects, dailyTrends, limits, budgetAlerts] = await Promise.all([
        fetchUsageOverviewAPI(),
        fetchProjectUsageAPI(),
        fetchDailyTrendsAPI(),
        fetchUsageLimitsAPI(),
        fetchBudgetAlertsAPI(),
      ]);

      setState({
        overview,
        projects,
        dailyTrends,
        limits,
        budgetAlerts,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载用量数据失败';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  /** 更新用量限制 */
  const updateLimits = useCallback(async (limits: UsageLimits): Promise<boolean> => {
    try {
      const updated = await updateUsageLimitsAPI(limits);
      setState((prev) => ({ ...prev, limits: updated }));
      return true;
    } catch {
      return false;
    }
  }, []);

  /** 更新预算预警 */
  const updateBudgetAlerts = useCallback(async (alerts: BudgetAlerts): Promise<boolean> => {
    try {
      const updated = await updateBudgetAlertsAPI(alerts);
      setState((prev) => ({ ...prev, budgetAlerts: updated }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    refresh: loadAll,
    updateLimits,
    updateBudgetAlerts,
  };
}