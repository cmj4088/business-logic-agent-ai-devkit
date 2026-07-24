/** PrivacyPolicyModal — 隐私政策弹窗
 *
 * 首次使用时弹出，用户必须同意才能继续使用应用。
 * 符合 PIPL（个人信息保护法）要求。
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

export function PrivacyPolicyModal({ isOpen, onAgree, onDisagree }: PrivacyPolicyModalProps) {
  const [hasRead, setHasRead] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleAgree = useCallback(() => {
    if (!hasRead) return;
    onAgree();
    setHasRead(false);
  }, [hasRead, onAgree]);

  const handleScrollToBottom = useCallback(() => {
    setHasRead(true);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
            🔒
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">隐私政策</h2>
            <p className="text-sm text-slate-500">最后更新：2026 年 7 月</p>
          </div>
        </div>

        <div
          className="mb-4 flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
              handleScrollToBottom();
            }
          }}
        >
          <h3 className="mb-2 font-semibold text-slate-800">1. 信息收集</h3>
          <p className="mb-3">
            Business Logic Agent 是一款桌面应用，所有项目数据默认存储在您的本地计算机上。
            我们不会主动收集、上传或分享您的个人数据。
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>账户信息：邮箱地址、显示名称（本地加密存储）</li>
            <li>项目数据：产品需求、技术方案、市场分析等（本地 SQLite 数据库）</li>
            <li>LLM 调用数据：提示词内容和上下文（仅在您使用云端 API 时发送）</li>
          </ul>

          <h3 className="mb-2 font-semibold text-slate-800">2. 数据存储</h3>
          <p className="mb-3">
            所有数据默认存储在本地文件系统中。使用 Ollama 本地模型时，数据完全不出境。
            使用云端 API（Anthropic/OpenAI）时，提示词和上下文会被发送到境外服务器。
          </p>

          <h3 className="mb-2 font-semibold text-slate-800">3. 数据安全</h3>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>API 密钥使用 Fernet 加密存储</li>
            <li>密码使用 bcrypt 哈希存储</li>
            <li>发送至 LLM 的数据经过最小化过滤</li>
            <li>日志不包含敏感信息（密钥、密码、个人身份信息）</li>
          </ul>

          <h3 className="mb-2 font-semibold text-slate-800">4. 您的权利</h3>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>您可以随时导出所有项目数据</li>
            <li>您可以随时清除所有本地数据</li>
            <li>您可以随时卸载应用，所有数据将被删除</li>
          </ul>

          <h3 className="mb-2 font-semibold text-slate-800">5. 联系我们</h3>
          <p className="mb-3">
            如有隐私相关问题，请通过应用内反馈功能联系我们。
          </p>
        </div>

        {!hasRead && (
          <p className="mb-3 text-center text-xs text-amber-600">
            👆 请滚动阅读完整隐私政策后继续
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDisagree}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            不同意并退出
          </button>
          <button
            type="button"
            onClick={handleAgree}
            disabled={!hasRead}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            已阅读并同意
          </button>
        </div>
      </div>
    </dialog>
  );
}