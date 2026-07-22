/** M14a 项目 WebSocket 连接 Hook */

import { useEffect, useRef, useCallback } from 'react';

type WSMessageHandler = (data: unknown) => void;

interface UseProjectWSReturn {
  send: (data: unknown) => void;
  close: () => void;
}

export function useProjectWS(
  projectId: string,
  onMessage: WSMessageHandler,
): UseProjectWSReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef<WSMessageHandler>(onMessage);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);

  // 始终保持最新的回调引用，但不触发 Effect 重运行
  onMessageRef.current = onMessage;

  const close = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback(
    (data: unknown) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      }
    },
    [],
  );

  useEffect(() => {
    if (!projectId) return;

    isUnmountedRef.current = false;

    const connect = () => {
      const token = localStorage.getItem('ipd_access_token') ?? '';
      const wsUrl = `ws://localhost:8000/ws/stage/${projectId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        console.log('[WS] 项目', projectId, 'WebSocket 已连接');
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data as string) as unknown;
          onMessageRef.current(parsed);
        } catch {
          // 忽略无法解析的消息
        }
      };

      ws.onerror = () => {
        // 静默处理，onclose 会触发重连
      };

      ws.onclose = (event: CloseEvent) => {
        wsRef.current = null;
        // 非正常关闭时自动重连（排除主动关闭 code=1000）
        if (event.code !== 1000 && !isUnmountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isUnmountedRef.current = true;
      close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return { send, close };
}