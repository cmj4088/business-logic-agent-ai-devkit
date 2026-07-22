/** M17 DataExportNotice — 数据出境告知弹窗 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface DataExportNoticeProps {
  isOpen: boolean;
  backend: 'deepseek' | 'anthropic' | 'openai';
  onAgree: () => void;
  onDisagree: () => void;
  onClose: () => void;
}

const DATA_EXPORT_INFO: Record<'deepseek' | 'anthropic' | 'openai', {
  destination: string;
  company: string;
  dataTypes: string[];
  purpose: string;
}> = {
  deepseek: {
    destination: '中国',
    company: '深度求索（DeepSeek）',
    dataTypes: ['提示词内容', '项目上下文信息', 'Agent 角色配置', '模型参数'],
    purpose: '通过 DeepSeek API 进行 AI 推理和文本生成',
  },
  anthropic: {
    destination: '美国',
    company: 'Anthropic',
    dataTypes: ['提示词内容', '项目上下文信息', 'Agent 角色配置', '模型参数'],
    purpose: '通过 Anthropic Claude API 进行 AI 推理和文本生成',
  },
  openai: {
    destination: '美国',
    company: 'OpenAI',
    dataTypes: ['提示词内容', '项目上下文信息', 'Agent 角色配置', '模型参数'],
    purpose: '通过 OpenAI GPT API 进行 AI 推理和文本生成',
  },
};

export function DataExportNotice({
  isOpen,
  backend,
  onAgree,
  onDisagree,
  onClose,
}: DataExportNoticeProps) {
  const [checked, setChecked] = useState(false);
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

  const info = DATA_EXPORT_INFO[backend];

  const handleAgree = useCallback(() => {
    if (!checked) return;
    onAgree();
    setChecked(false);
  }, [checked, onAgree]);

  const handleDisagree = useCallback(() => {
    setChecked(false);
    onDisagree();
  }, [onDisagree]);

  const handleDialogClose = useCallback(() => {
    // 如果对话框被 ESC 关闭但没有勾选同意，视为不同意
    if (!checked) {
      onDisagree();
    }
    setChecked(false);
    onClose();
  }, [checked, onDisagree, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleDialogClose}
      className="rounded-xl border border-deep-border bg-deep-card p-0 shadow-xl backdrop:bg-black/70"
    >
      <div className="w-full max-w-md p-6">
        {/* 标题 */}
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xl">
            ⚠️
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">数据出境告知</h2>
            <p className="mt-1 text-sm text-slate-500">
              您即将使用 {info.company} 云端 API 服务
            </p>
          </div>
        </div>

        {/* 详情 */}
        <div className="mb-4 space-y-3 rounded-lg bg-amber-500/10 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">数据发送目的地</span>
            <span className="font-medium text-slate-200">{info.destination}（{info.company} 服务器）</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">数据用途</span>
            <span className="max-w-[220px] text-right font-medium text-slate-200">{info.purpose}</span>
          </div>
          <div>
            <span className="mb-1 block text-sm text-slate-500">涉及的数据类型</span>
            <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-300">
              {info.dataTypes.map((dt) => (
                <li key={dt}>{dt}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 警告 */}
        <p className="mb-4 text-sm text-red-400">
          使用云端 API 意味着数据将被发送到境外服务器，请确保您已获得相关授权。
        </p>

        {/* 同意勾选 */}
        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-deep-border bg-deep-surface p-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-500 text-neon-blue focus:ring-neon-blue bg-deep-surface"
          />
          <span className="text-sm text-slate-300">
            我已阅读并理解以上数据出境说明，同意将数据发送至境外服务器进行处理。
          </span>
        </label>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDisagree}
            className="flex-1 rounded-lg border border-deep-border bg-deep-surface px-4 py-2 text-sm font-medium text-slate-400 shadow-sm transition-colors hover:bg-deep-border focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1"
          >
            不同意
          </button>
          <button
            type="button"
            onClick={handleAgree}
            disabled={!checked}
            className="flex-1 rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neon-blue/90 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            同意并继续
          </button>
        </div>
      </div>
    </dialog>
  );
}