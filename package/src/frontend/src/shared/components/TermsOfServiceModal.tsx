/** TermsOfServiceModal — 用户协议弹窗
 *
 * 首次使用时弹出，用户必须同意才能继续使用应用。
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

export function TermsOfServiceModal({ isOpen, onAgree, onDisagree }: TermsOfServiceModalProps) {
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
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl">
            📋
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">用户协议</h2>
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
          <h3 className="mb-2 font-semibold text-slate-800">1. 服务说明</h3>
          <p className="mb-3">
            Business Logic Agent（以下简称"本软件"）是一款 AI 驱动的商业逻辑工作流桌面应用，
            使用 AI Agent 协作完成 IPD 全流程。本软件为本地桌面应用，非 SaaS 服务。
          </p>

          <h3 className="mb-2 font-semibold text-slate-800">2. 使用许可</h3>
          <p className="mb-3">
            授予您非独占、不可转让的许可，在个人计算机上安装和使用本软件。
            您不得对本软件进行逆向工程、反编译或反汇编。
          </p>

          <h3 className="mb-2 font-semibold text-slate-800">3. AI 生成内容声明</h3>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>本软件使用 AI 模型生成内容，所有 AI 产出物均标注"AI 生成"标识</li>
            <li>AI 生成内容仅供参考，不构成专业建议</li>
            <li>用户应对 AI 生成内容的准确性和适用性进行独立审查</li>
            <li>单人模式下门禁自动通过，UI 标注"自动通过，未经人工实质审查"</li>
          </ul>

          <h3 className="mb-2 font-semibold text-slate-800">4. 免责声明</h3>
          <ul className="mb-3 list-inside list-disc space-y-1">
            <li>本软件按"现状"提供，不提供任何明示或暗示的保证</li>
            <li>AI 生成内容可能存在错误、偏见或不准确之处</li>
            <li>因使用本软件产生的任何商业决策风险由用户自行承担</li>
            <li>我们不对 AI 模型输出的完整性、准确性或可靠性承担责任</li>
          </ul>

          <h3 className="mb-2 font-semibold text-slate-800">5. 责任限制</h3>
          <p className="mb-3">
            在法律允许的最大范围内，本软件开发者不对因使用或无法使用本软件而产生的
            任何直接、间接、附带、特殊或后果性损害承担责任。
          </p>

          <h3 className="mb-2 font-semibold text-slate-800">6. 终止</h3>
          <p className="mb-3">
            您可以随时停止使用本软件。违反本协议条款将导致许可自动终止。
          </p>
        </div>

        {!hasRead && (
          <p className="mb-3 text-center text-xs text-amber-600">
            👆 请滚动阅读完整用户协议后继续
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
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            已阅读并同意
          </button>
        </div>
      </div>
    </dialog>
  );
}