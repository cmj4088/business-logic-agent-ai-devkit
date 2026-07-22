/** M14b StageRollbackModal — 阶段回退确认弹窗 */

import type { FC } from 'react';
import { useState } from 'react';
import type { IPDStage } from '@/shared/types';
import { STAGE_LABELS } from '../types';

interface StageRollbackModalProps {
  isOpen: boolean;
  currentStage: IPDStage;
  targetStage: IPDStage;
  isOperating: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const StageRollbackModal: FC<StageRollbackModalProps> = ({
  isOpen,
  currentStage,
  targetStage,
  isOperating,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-deep-card shadow-2xl border border-deep-border">
        <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-red-400">确认阶段回退</h3>
          <p className="mt-1 text-sm text-red-400">此操作会回退到之前的阶段，请注意数据影响</p>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-xs text-red-400 mb-1">当前阶段</p>
              <p className="text-sm font-semibold text-red-400">{STAGE_LABELS[currentStage]}</p>
            </div>
            <div className="shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
            </div>
            <div className="flex-1 rounded-lg border border-deep-border bg-deep-surface p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">回退至</p>
              <p className="text-sm font-semibold text-slate-200">{STAGE_LABELS[targetStage]}</p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="rollback-reason" className="mb-1 block text-sm font-medium text-slate-200">
              回退原因（必填）
            </label>
            <textarea
              id="rollback-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请说明回退的原因..."
              rows={3}
              className="w-full rounded-lg border border-deep-border bg-deep-base px-3 py-2 text-sm text-slate-200 shadow-sm placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-red-400">⚠️</span>
              <div className="text-xs text-red-400">
                <p className="font-medium">回退影响：</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>当前阶段的产出物将归档为历史版本</li>
                  <li>当前阶段的审核状态将重置</li>
                  <li>回退操作将记录在审计日志中</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-deep-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isOperating}
            className="rounded-lg border border-deep-border bg-deep-card px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-deep-surface focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isOperating || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOperating ? '回退中...' : '确认回退'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageRollbackModal;