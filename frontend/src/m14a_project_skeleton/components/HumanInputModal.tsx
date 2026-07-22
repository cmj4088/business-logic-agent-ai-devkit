/** M14b HumanInputModal — 人工输入弹窗（含 3 种 bypass 选项） */

import type { FC } from 'react';
import { useState } from 'react';

interface HumanInputModalProps {
  /** 是否显示弹窗 */
  isOpen: boolean;
  /** 活动名称 */
  activityName: string;
  /** 提示文本 */
  prompt: string;
  /** 是否需要文件上传 */
  allowFileUpload?: boolean;
  /** 提交人工输入 */
  onSubmit: (input: string) => void;
  /** 选择 bypass */
  onBypass: (option: 'skip_once' | 'auto_until_error' | 'let_agent_decide') => void;
  /** 关闭弹窗 */
  onClose: () => void;
}

const HumanInputModal: FC<HumanInputModalProps> = ({
  isOpen,
  activityName,
  prompt,
  allowFileUpload = false,
  onSubmit,
  onBypass,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (input.trim() || selectedFile) {
      onSubmit(input);
      setInput('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-deep-card shadow-2xl border border-deep-border">
        {/* 头部 */}
        <div className="border-b border-deep-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">需要人工输入</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-deep-surface hover:text-slate-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            活动「{activityName}」需要您的输入才能继续
          </p>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          <p className="mb-4 text-sm text-slate-300">{prompt}</p>

          {/* 文本输入 */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入您的意见或决策..."
            rows={4}
            className="w-full rounded-lg border border-deep-border bg-deep-base px-3 py-2 text-sm text-slate-200 shadow-sm placeholder:text-slate-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />

          {/* 文件上传 */}
          {allowFileUpload && (
            <div className="mt-3">
              <label
                htmlFor="human-input-file"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-deep-border px-4 py-3 text-sm text-slate-400 transition-colors hover:border-neon-blue hover:text-neon-blue"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {selectedFile ? selectedFile.name : '上传附件（可选）'}
              </label>
              <input
                id="human-input-file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* 操作区 */}
        <div className="border-t border-deep-border px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() && !selectedFile}
              className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              提交
            </button>

            {/* Bypass 选项 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">或选择：</span>
              <button
                type="button"
                onClick={() => onBypass('skip_once')}
                className="rounded-lg border border-deep-border bg-deep-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-deep-surface"
              >
                跳过本次
              </button>
              <button
                type="button"
                onClick={() => onBypass('auto_until_error')}
                className="rounded-lg border border-deep-border bg-deep-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-deep-surface"
              >
                自动通过直到异常
              </button>
              <button
                type="button"
                onClick={() => onBypass('let_agent_decide')}
                className="rounded-lg border border-deep-border bg-deep-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-deep-surface"
              >
                让 Agent 自己决定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanInputModal;