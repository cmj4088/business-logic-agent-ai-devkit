/** M12 Dashboard 模块 — WebSocket 连接 Hook
 *
 * 连接 M8 WebSocket 接收实时状态更新。
 * 连接失败时降级为轮询模式，通过 onFallbackToPolling 回调通知上层。
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { DashboardWSMessage } from '../types';

/** WebSocket 连接状态 */
export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'fallback';

interface UseDashboardWSOptions {
  /** 收到 WebSocket 消息时的回调 */
  onMessage: (message: DashboardWSMessage) => void;
  /** 连接失败降级为轮询时的回调 */
  onFallbackToPolling: () => void;
  /** 轮询间隔（毫秒），默认 10000 */
  pollIntervalMs?: number;
}

interface UseDashboardWSResult {
  /** 当前 WebSocket 连接状态 */
  status: WSConnectionStatus;
  /** 手动重连 */
  reconnect: () => void;
}

/** 构建 WebSocket URL — 后端无 /ws/dashboard 端点，直接返回 null 降级为轮询 */
function buildWsUrl(): string | null {
  return null;
}

/** 判断是否为有效的 Dashboard WS 消息 */
function isDashboardMessage(data: unknown): data is DashboardWSMessage {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    ['pending_tasks_update', 'notification', 'project_update', 'dashboard_refresh'].includes(obj.type)
  );
}

export function useDashboardWS({
  onMessage,
  onFallbackToPolling,
  pollIntervalMs = 10000,
}: UseDashboardWSOptions): UseDashboardWSResult {
  const [status, setStatus] = useState<WSConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 3;

  /** 清理轮询定时器 */
  const clearPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** 清理 WebSocket 连接 */
  const cleanupWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  /** 降级为轮询 */
  const fallbackToPolling = useCallback(() => {
    if (!isMountedRef.current) return;
    cleanupWs();
    setStatus('fallback');
    clearPolling();
    pollTimerRef.current = setInterval(() => {
      onFallbackToPolling();
    }, pollIntervalMs);
  }, [cleanupWs, clearPolling, onFallbackToPolling, pollIntervalMs]);

  /** 建立 WebSocket 连接 */
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const url = buildWsUrl();
    if (!url) {
      // 后端无该 WebSocket 端点，直接降级为轮询
      fallbackToPolling();
      return;
    }

    if (reconnectAttemptRef.current >= maxReconnectAttempts) {
      fallbackToPolling();
      return;
    }

    cleanupWs();
    clearPolling();
    setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        reconnectAttemptRef.current = 0;
        setStatus('connected');
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const data: unknown = JSON.parse(event.data as string);
          if (isDashboardMessage(data)) {
            onMessage(data);
          }
        } catch {
          // 忽略解析失败的消息
        }
      };

      ws.onerror = () => {
        // WebSocket 错误由 onclose 统一处理
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        wsRef.current = null;
        reconnectAttemptRef.current += 1;
        // 延迟重连
        setTimeout(() => {
          connect();
        }, 2000);
      };
    } catch {
      fallbackToPolling();
    }
  }, [cleanupWs, clearPolling, fallbackToPolling, onMessage]);

  /** 手动重连 */
  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    clearPolling();
    connect();
  }, [clearPolling, connect]);

  // 挂载时连接，卸载时清理
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      cleanupWs();
      clearPolling();
    };
  }, [connect, cleanupWs, clearPolling]);

  return { status, reconnect };
}