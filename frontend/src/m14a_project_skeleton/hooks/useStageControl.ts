/** M14b useStageControl — 阶段控制 Hook */

import { useState, useCallback } from 'react';
import type { IPDStage } from '@/shared/types';
import type { StageResponse } from '../types';
import { advanceStage, rollbackStage, pauseProject, resumeProject } from '../api';

interface UseStageControlReturn {
  /** 是否正在执行操作 */
  isOperating: boolean;
  /** 错误信息 */
  error: string | null;
  /** 推进到下一阶段 */
  advance: (targetStage: IPDStage) => Promise<StageResponse | null>;
  /** 回退到上一阶段 */
  rollback: (targetStage: IPDStage, reason: string) => Promise<StageResponse | null>;
  /** 暂停项目 */
  pause: () => Promise<void>;
  /** 恢复项目 */
  resume: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

export function useStageControl(projectId: string): UseStageControlReturn {
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advance = useCallback(
    async (targetStage: IPDStage): Promise<StageResponse | null> => {
      setIsOperating(true);
      setError(null);
      try {
        const result = await advanceStage(projectId, { targetStage, confirm: true });
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '阶段推进失败';
        setError(msg);
        return null;
      } finally {
        setIsOperating(false);
      }
    },
    [projectId],
  );

  const rollback = useCallback(
    async (targetStage: IPDStage, reason: string): Promise<StageResponse | null> => {
      setIsOperating(true);
      setError(null);
      try {
        const result = await rollbackStage(projectId, { targetStage, reason });
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '阶段回退失败';
        setError(msg);
        return null;
      } finally {
        setIsOperating(false);
      }
    },
    [projectId],
  );

  const pause = useCallback(async () => {
    setIsOperating(true);
    setError(null);
    try {
      await pauseProject(projectId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '暂停项目失败';
      setError(msg);
    } finally {
      setIsOperating(false);
    }
  }, [projectId]);

  const resume = useCallback(async () => {
    setIsOperating(true);
    setError(null);
    try {
      await resumeProject(projectId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '恢复项目失败';
      setError(msg);
    } finally {
      setIsOperating(false);
    }
  }, [projectId]);

  const clearError = useCallback(() => setError(null), []);

  return { isOperating, error, advance, rollback, pause, resume, clearError };
}