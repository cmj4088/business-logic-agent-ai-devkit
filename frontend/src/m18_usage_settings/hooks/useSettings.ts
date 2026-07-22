/** M18 用量与设置模块 — 设置数据 Hook */

import { useState, useEffect, useCallback } from 'react';
import type { GlobalSettings, SettingsState } from '../types';
import {
  fetchSettingsAPI,
  updateSettingsAPI,
  exportDataAPI,
  clearDataAPI,
} from '../api';

const initialState: SettingsState = {
  settings: null,
  isLoading: true,
  error: null,
  isSaving: false,
};

export function useSettings() {
  const [state, setState] = useState<SettingsState>(initialState);

  const loadSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const settings = await fetchSettingsAPI();
      setState({ settings, isLoading: false, error: null, isSaving: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载设置失败';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  /** 更新全局设置 */
  const saveSettings = useCallback(async (settings: GlobalSettings): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSaving: true }));
    try {
      const updated = await updateSettingsAPI(settings);
      setState((prev) => ({ ...prev, settings: updated, isSaving: false }));
      return true;
    } catch {
      setState((prev) => ({ ...prev, isSaving: false }));
      return false;
    }
  }, []);

  /** 导出数据 */
  const exportData = useCallback(async (): Promise<boolean> => {
    try {
      const blob = await exportDataAPI();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ipd-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** 清除所有数据 */
  const clearAllData = useCallback(async (confirmation: string): Promise<boolean> => {
    try {
      await clearDataAPI(confirmation);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...state,
    refresh: loadSettings,
    saveSettings,
    exportData,
    clearAllData,
  };
}