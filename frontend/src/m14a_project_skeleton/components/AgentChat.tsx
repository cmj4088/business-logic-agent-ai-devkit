/** M14b AgentChat — 微信/QQ 风格 Agent 对话区（圆圈头像 + 气泡消息） */

import type { FC } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAgentChat } from '../hooks/useAgentChat';
import type { ReasoningSummary } from '../types';

interface AgentChatProps {
  projectId: string;
  stage?: string;
}

/** Agent 角色中文名映射 */
const ROLE_NAMES: Record<string, string> = {
  product_manager: '产品经理·小王',
  rd: '研发架构师·老张',
  qa: '测试专家',
  marketing: '市场专家',
  manufacturing: '制造工程师',
  finance: '财务分析师',
  human: '我',
};

/** Agent 角色首字（用于头像显示） */
const ROLE_AVATARS: Record<string, string> = {
  product_manager: '王',
  rd: '张',
  qa: '测',
  marketing: '市',
  manufacturing: '制',
  finance: '财',
  human: '我',
};

/** Agent 角色头像背景色 */
const ROLE_AVATAR_BG: Record<string, string> = {
  product_manager: 'bg-gradient-to-br from-blue-400 to-blue-600',
  rd: 'bg-gradient-to-br from-purple-400 to-purple-600',
  qa: 'bg-gradient-to-br from-green-400 to-green-600',
  marketing: 'bg-gradient-to-br from-orange-400 to-orange-600',
  manufacturing: 'bg-gradient-to-br from-amber-400 to-amber-600',
  finance: 'bg-gradient-to-br from-teal-400 to-teal-600',
  human: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
};

/** 推理摘要组件 */
const ReasoningSummaryCard: FC<{ summary: ReasoningSummary }> = ({ summary }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-4 my-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">💭</span>
          <span className="text-sm font-medium text-indigo-400">推理摘要</span>
        </div>
        <span className="text-xs text-indigo-400 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">参与讨论：</span>
            <span className="text-indigo-400">
              {summary.participants.map((p) => ROLE_NAMES[p] ?? p).join('、')}
            </span>
            <span className="text-slate-500">（{summary.roundCount} 轮）</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400">最终共识：</span>
            <span className="text-slate-300">{summary.consensus}</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-400">决策逻辑链：</span>
            {summary.logicChain.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 text-indigo-400">{i + 1}.</span>
                <span className="text-slate-400">{step}</span>
              </div>
            ))}
          </div>
          {summary.dissentingOpinion && (
            <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
              <p className="text-xs text-amber-400">
                <span className="font-medium">唯一反对：</span>
                {summary.dissentingOpinion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** 单条消息气泡 */
const MessageBubble: FC<{ msg: { id: string; sender: string; content: string; createdAt: string; messageType?: string } }> = ({ msg }) => {
  const isHuman = msg.sender === 'human';
  const avatar = ROLE_AVATARS[msg.sender] ?? '?';
  const avatarBg = ROLE_AVATAR_BG[msg.sender] ?? 'bg-gradient-to-br from-slate-400 to-slate-600';
  const name = ROLE_NAMES[msg.sender] ?? msg.sender;

  return (
    <div className={`flex gap-2.5 ${isHuman ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <div className={`shrink-0 w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-medium shadow-sm`}>
        {avatar}
      </div>
      {/* 气泡 */}
      <div className={`flex flex-col max-w-[75%] ${isHuman ? 'items-end' : 'items-start'}`}>
        <span className="text-xs text-slate-500 mb-0.5 px-1">
          {name} · {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm ${
            isHuman
              ? 'bg-neon-blue text-white rounded-tr-sm'
              : msg.messageType === 'system'
                ? 'bg-deep-surface text-slate-500 rounded-tl-sm'
                : 'bg-deep-surface border border-deep-border text-slate-300 rounded-tl-sm'
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
};

const AgentChat: FC<AgentChatProps> = ({ projectId, stage }) => {
  const {
    messages,
    isLoadingHistory,
    isStreaming,
    streamingContent,
    streamingAgent,
    summary,
    send,
    error,
  } = useAgentChat(projectId, stage);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSend = useCallback(() => {
    if (input.trim()) {
      void send(input);
      setInput('');
    }
  }, [input, send]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // 当前参与的 Agent 头像列表（用于顶部展示）
  const activeAgents = ['product_manager', 'rd', 'qa', 'marketing', 'manufacturing', 'finance'];

  return (
    <div className="flex flex-col rounded-lg border border-deep-border bg-deep-card overflow-hidden h-full">
      {/* 头部 — Agent 群组头像 */}
      <div className="shrink-0 px-4 py-3 border-b border-deep-border bg-deep-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {activeAgents.map((role) => (
                <div
                  key={role}
                  className={`w-7 h-7 rounded-full ${ROLE_AVATAR_BG[role]} flex items-center justify-center text-white text-xs font-medium border-2 border-deep-card shadow-sm`}
                  title={ROLE_NAMES[role]}
                >
                  {ROLE_AVATARS[role]}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-200">IPD 协作群</h3>
              <p className="text-xs text-slate-500">{activeAgents.length} 位 Agent 在线</p>
            </div>
          </div>
          {isStreaming && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neon-blue/15 px-2.5 py-0.5 text-xs font-medium text-neon-blue">
              <span className="inline-block h-2 w-2 rounded-full bg-neon-blue animate-pulse" />
              协作中
            </span>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-deep-base/50">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {isLoadingHistory && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-slate-500">加载历史消息...</p>
          </div>
        )}

        {!isLoadingHistory && messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex -space-x-2 mb-3">
              {activeAgents.slice(0, 3).map((role) => (
                <div
                  key={role}
                  className={`w-10 h-10 rounded-full ${ROLE_AVATAR_BG[role]} flex items-center justify-center text-white text-sm font-medium border-2 border-deep-card shadow-sm`}
                >
                  {ROLE_AVATARS[role]}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">暂无对话记录</p>
            <p className="text-xs text-slate-600 mt-1">开始一个活动后，Agent 将在此协作讨论</p>
          </div>
        )}

        {/* 历史消息 */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* 流式输出 */}
        {isStreaming && streamingContent && (
          <div className={`flex gap-2.5 flex-row`}>
            <div className={`shrink-0 w-9 h-9 rounded-full ${ROLE_AVATAR_BG[streamingAgent] ?? 'bg-slate-400'} flex items-center justify-center text-white text-sm font-medium shadow-sm`}>
              {ROLE_AVATARS[streamingAgent] ?? '?'}
            </div>
            <div className="flex flex-col max-w-[75%] items-start">
              <span className="text-xs text-slate-500 mb-0.5 px-1">
                {ROLE_NAMES[streamingAgent] ?? streamingAgent}
                <span className="inline-flex items-center gap-1 ml-1 text-neon-blue">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-blue animate-pulse" />
                  输出中
                </span>
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-deep-surface border border-deep-border px-3.5 py-2 text-sm text-slate-300 whitespace-pre-wrap break-words shadow-sm">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-slate-500 animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 推理摘要 */}
      {summary && <ReasoningSummaryCard summary={summary} />}

      {/* 输入区 */}
      <div className="shrink-0 px-4 py-3 border-t border-deep-border bg-deep-surface">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，与 Agent 团队交流..."
            rows={2}
            disabled={isStreaming}
            className="flex-1 rounded-2xl border border-deep-border bg-deep-base px-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue resize-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 rounded-full bg-neon-blue px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
