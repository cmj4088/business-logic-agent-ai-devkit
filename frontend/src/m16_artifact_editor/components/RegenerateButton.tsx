/** M16 产出物编辑器 — 重新生成按钮组件 */

import { useState, useCallback } from 'react';
import type { RegenerateResponse } from '../types';
import { regenerateArtifactAPI } from '../api';

interface RegenerateButtonProps {
  /** 产出物 ID */
  artifactId: string;
  /** 产出物名称 */
  artifactName: string;
  /** 重新生成成功回调 */
  onRegenerated: (response: RegenerateResponse) => void;
}

/**
 * 重新生成按钮，点击后弹出对话框输入原因和额外指令，
 * 调用 M10 异常恢复 API 重新生成产出物。
 */
export function RegenerateButton({
  artifactId,
  artifactName,
  onRegenerated,
}: RegenerateButtonProps): React.ReactElement {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = useCallback(async () => {
    if (!reason.trim()) {
      setError('请填写重新生成的原因');
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await regenerateArtifactAPI({
        artifactId,
        reason: reason.trim(),
        instructions: instructions.trim() || undefined,
      });
      onRegenerated(response);
      setShowDialog(false);
      setReason('');
      setInstructions('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '重新生成失败，请稍后重试';
      setError(message);
    } finally {
      setIsRegenerating(false);
    }
  }, [artifactId, reason, instructions, onRegenerated]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 hover:border-indigo-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        重新生成
      </button>

      {/* 重新生成对话框 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              重新生成产出物
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              将调用 AI 重新生成「{artifactName}」的内容。当前版本将被保留，新内容将创建为新版本。
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="regenerate-reason" className="block text-sm font-medium text-slate-700 mb-1">
                  重新生成原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="regenerate-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="例如：内容不准确、需要更新数据、格式错误..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="regenerate-instructions" className="block text-sm font-medium text-slate-700 mb-1">
                  额外指令 <span className="text-slate-400">（可选）</span>
                </label>
                <textarea
                  id="regenerate-instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="例如：请更详细地描述市场分析部分..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDialog(false);
                  setError(null);
                }}
                disabled={isRegenerating}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={isRegenerating || !reason.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegenerating ? '生成中...' : '确认生成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}