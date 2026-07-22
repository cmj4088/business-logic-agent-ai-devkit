/** M14b StageAdvanceModal — 阶段推进确认弹窗 */

import type { FC } from 'react';
import type { IPDStage } from '@/shared/types';
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from '../types';

interface StageAdvanceModalProps {
  isOpen: boolean;
  currentStage: IPDStage;
  targetStage: IPDStage;
  isOperating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const StageAdvanceModal: FC<StageAdvanceModalProps> = ({
  isOpen,
  currentStage,
  targetStage,
  isOperating,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-deep-card shadow-2xl border border-deep-border">
        <div className="border-b border-deep-border px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-100">确认阶段推进</h3>
          <p className="mt-1 text-sm text-slate-400">请确认以下阶段推进操作</p>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* 当前阶段 */}
            <div className="flex-1 rounded-lg border border-deep-border bg-deep-surface p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">当前阶段</p>
              <p className="text-sm font-semibold text-slate-200">{STAGE_LABELS[currentStage]}</p>
              <p className="text-xs text-slate-500 mt-1">{STAGE_DESCRIPTIONS[currentStage]}</p>
            </div>

            {/* 箭头 */}
            <div className="shrink-0">
              <svg className="h-6 w-6 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* 目标阶段 */}
            <div className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center">
              <p className="text-xs text-blue-400 mb-1">目标阶段</p>
              <p className="text-sm font-semibold text-blue-400">{STAGE_LABELS[targetStage]}</p>
              <p className="text-xs text-blue-400 mt-1">{STAGE_DESCRIPTIONS[targetStage]}</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-400">⚠️</span>
              <p className="text-xs text-amber-400">
                推进后当前阶段将标记为"已完成"，已完成的阶段不可修改。请确认所有活动已处理完毕。
              </p>
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
            onClick={onConfirm}
            disabled={isOperating}
            className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neon-blue/80 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOperating ? '推进中...' : '确认推进'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageAdvanceModal;