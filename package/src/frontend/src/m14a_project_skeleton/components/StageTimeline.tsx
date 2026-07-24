/** M14a 阶段时间线组件 */

import type { FC } from 'react';
import type { IPDStage } from '@/shared/types';
import type { StageDetail } from '../types';
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from '../types';

interface StageTimelineProps {
  stages: StageDetail[];
  currentStage: IPDStage;
  onStageClick?: (stage: IPDStage) => void;
}

/** 阶段顺序 */
const STAGE_ORDER: IPDStage[] = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];

const StageTimeline: FC<StageTimelineProps> = ({ stages, currentStage, onStageClick }) => {
  const stageMap = new Map<IPDStage, StageDetail>(
    stages.map((s) => [s.stage, s]),
  );

  const getStageStatus = (stageKey: IPDStage): 'completed' | 'current' | 'pending' => {
    const stageFromData = stageMap.get(stageKey);
    if (stageFromData) {
      return stageFromData.status;
    }

    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    const stageIdx = STAGE_ORDER.indexOf(stageKey);
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'current';
    return 'pending';
  };

  const handleClick = (stageKey: IPDStage) => {
    const status = getStageStatus(stageKey);
    if (status === 'completed' && onStageClick) {
      onStageClick(stageKey);
    }
  };

  return (
    <div className="flex flex-col gap-0 py-2">
      {STAGE_ORDER.map((stageKey, idx) => {
        const status = getStageStatus(stageKey);
        const label = STAGE_LABELS[stageKey] ?? stageKey;
        const description = STAGE_DESCRIPTIONS[stageKey] ?? '';

        const isCompleted = status === 'completed';
        const isCurrent = status === 'current';
        const isClickable = isCompleted && onStageClick !== undefined;

        return (
          <div key={stageKey} className="relative flex">
            {/* 连接线 */}
            {idx < STAGE_ORDER.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-deep-border" />
            )}

            {/* 节点 */}
            <button
              type="button"
              className={`
                relative z-10 flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg transition-colors
                ${isCompleted ? 'hover:bg-emerald-500/10 cursor-pointer' : ''}
                ${isCurrent ? 'bg-blue-500/10 cursor-default' : ''}
                ${!isCompleted && !isCurrent ? 'cursor-default' : ''}
              `}
              onClick={() => handleClick(stageKey)}
              disabled={!isClickable}
              tabIndex={isClickable ? 0 : -1}
            >
              {/* 状态图标 */}
              <span
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold
                  ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-500/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-deep-surface text-slate-500' : ''}
                `}
              >
                {isCompleted ? '✓' : idx + 1}
              </span>

              {/* 标签与描述 */}
              <div className="min-w-0">
                <div
                  className={`
                    text-sm font-medium
                    ${isCompleted ? 'text-emerald-400' : ''}
                    ${isCurrent ? 'text-blue-400' : ''}
                    ${!isCompleted && !isCurrent ? 'text-slate-500' : ''}
                  `}
                >
                  {label}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {description}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default StageTimeline;