/** M14b useAgentChat — Agent 对话 Hook（流式接收 + 推理摘要 + 历史消息） */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, ReasoningSummary } from '../types';
import { fetchMessages, sendMessage } from '../api';
import type { StreamMessageEvent as StreamEvent } from '../api';

interface UseAgentChatReturn {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 是否正在加载历史消息 */
  isLoadingHistory: boolean;
  /** 是否正在接收流式输出 */
  isStreaming: boolean;
  /** 当前流式输出的内容 */
  streamingContent: string;
  /** 当前流式输出的 Agent 角色 */
  streamingAgent: string;
  /** 推理摘要 */
  summary: ReasoningSummary | null;
  /** 发送用户输入 */
  send: (content: string) => Promise<void>;
  /** 重新加载历史消息 */
  reload: () => Promise<void>;
  /** 错误信息 */
  error: string | null;
}

export function useAgentChat(projectId: string, stage?: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingAgent, setStreamingAgent] = useState('');
  const [summary, setSummary] = useState<ReasoningSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamingBuffer = useRef('');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);

  /** 加载历史消息 */
  const loadHistory = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const history = await fetchMessages(projectId, stage);
      setMessages(history);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载消息历史失败';
      setError(msg);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [projectId, stage]);

  /** 发送用户消息 */
  const send = useCallback(async (content: string) => {
    if (!content.trim() || !projectId) return;
    setError(null);

    try {
      const userMsg = await sendMessage(projectId, content);
      setMessages((prev) => [...prev, userMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '发送消息失败';
      setError(msg);
    }
  }, [projectId]);

  /** 建立 WebSocket 连接接收流式输出 */
  useEffect(() => {
    if (!projectId) return;

    isUnmountedRef.current = false;

    const connect = () => {
      const wsToken = localStorage.getItem('ipd_access_token') ?? '';
      const wsUrl = `ws://localhost:8000/ws/messages/${projectId}?token=${wsToken}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setError(null);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as StreamEvent;

          switch (data.type) {
            case 'token':
              setIsStreaming(true);
              setStreamingAgent(data.agentRole ?? '');
              streamingBuffer.current += data.content ?? '';
              setStreamingContent(streamingBuffer.current);
              break;

            case 'done': {
              setIsStreaming(false);
              if (streamingBuffer.current && data.agentRole) {
                const newMsg: ChatMessage = {
                  id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  projectId,
                  sender: data.agentRole as ChatMessage['sender'],
                  senderLabel: data.agentRole,
                  messageType: 'response',
                  content: streamingBuffer.current,
                  stage: stage ?? '',
                  createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, newMsg]);
              }
              streamingBuffer.current = '';
              setStreamingContent('');
              setStreamingAgent('');
              break;
            }

            case 'summary':
              if (data.summary) {
                setSummary(data.summary);
              }
              break;

            case 'error':
              setError(data.error ?? '流式接收错误');
              setIsStreaming(false);
              break;
          }
        } catch {
          // 忽略无法解析的消息
        }
      };

      ws.onerror = () => {
        // 静默处理，onclose 会触发重连
      };

      ws.onclose = (event: CloseEvent) => {
        wsRef.current = null;
        if (event.code !== 1000 && !isUnmountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId, stage]);

  /** 初始加载历史消息 */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    messages,
    isLoadingHistory,
    isStreaming,
    streamingContent,
    streamingAgent,
    summary,
    send,
    reload: loadHistory,
    error,
  };
}