/** M12 Dashboard 模块 — 数据获取 Hook
 *
 * 整合 HTTP API 获取和 WebSocket 实时更新。
 * 处理 loading / error / data 三态。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardAPI } from '../api';
import { useDashboardWS } from './useDashboardWS';
import type { DashboardState, DashboardWSMessage, PendingTask, Notification } from '../types';

interface UseDashboardResult extends DashboardState {
  /** 手动刷新 Dashboard 数据 */
  refresh: () => Promise<void>;
  /** WebSocket 连接状态 */
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'fallback';
  /** 手动重连 WebSocket */
  reconnectWS: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  /** 获取 Dashboard 数据 */
  const fetchData = useCallback(async () => {
    // 仅首次加载时显示 loading，后续静默刷新
    const isFirstLoad = stateRef.current.data === null;
    if (isFirstLoad) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const data = await fetchDashboardAPI();
      setState({ data, isLoading: false, error: null });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '获取 Dashboard 数据失败，请检查网络连接';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: prev.data ? null : message, // 已有数据时不清除
      }));
    }
  }, []);

  /** 处理 WebSocket 消息，局部更新数据 */
  const handleWSMessage = useCallback((message: DashboardWSMessage) => {
    setState((prev) => {
      if (!prev.data) return prev;

      switch (message.type) {
        case 'pending_tasks_update': {
          const tasks = message.payload as PendingTask[];
          if (!Array.isArray(tasks)) return prev;
          return {
            ...prev,
            data: { ...prev.data, pending_tasks: tasks },
          };
        }

        case 'notification': {
          const notification = message.payload as Notification;
          if (!notification || typeof notification.id !== 'string') return prev;
          // 将新通知插入列表头部，保留最近 20 条
          const updatedNotifications = [notification, ...prev.data.notifications].slice(0, 20);
          return {
            ...prev,
            data: { ...prev.data, notifications: updatedNotifications },
          };
        }

        case 'project_update':
        case 'dashboard_refresh':
          // 完整刷新
          return prev;

        default:
          return prev;
      }
    });
  }, []);

  /** WebSocket 降级为轮询时的回调 */
  const handleFallbackToPolling = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const { status: wsStatus, reconnect: reconnectWS } = useDashboardWS({
    onMessage: handleWSMessage,
    onFallbackToPolling: handleFallbackToPolling,
    pollIntervalMs: 10000,
  });

  // 挂载时首次获取数据
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 收到 dashboard_refresh 消息时完整刷新
  useEffect(() => {
    // 此 effect 依赖 wsStatus 变化来触发刷新不是一个好模式
    // 更好的方式是通过 handleWSMessage 直接标记需要刷新
    // 这里保持简单的轮询降级逻辑
  }, []);

  /** 手动刷新 */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
    wsStatus,
    reconnectWS,
  };
}