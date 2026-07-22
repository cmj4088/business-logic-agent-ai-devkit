/** M14b useActivityActions — 活动操作 Hook */

import { useState, useCallback } from 'react';
import type { Activity, ActivityActionRequest } from '../types';
import { performActivityAction } from '../api';

interface UseActivityActionsReturn {
  /** 是否正在执行操作 */
  isActing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 开始活动 */
  start: (activityId: string) => Promise<Activity | null>;
  /** 跳过活动 */
  skip: (activityId: string) => Promise<Activity | null>;
  /** 完成活动 */
  complete: (activityId: string, humanInput?: string) => Promise<Activity | null>;
  /** bypass 活动 */
  bypass: (activityId: string, option: ActivityActionRequest['bypassOption']) => Promise<Activity | null>;
  /** 清除错误 */
  clearError: () => void;
}

export function useActivityActions(projectId: string): UseActivityActionsReturn {
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(
    async (activityId: string, action: ActivityActionRequest): Promise<Activity | null> => {
      setIsActing(true);
      setError(null);
      try {
        const result = await performActivityAction(projectId, activityId, action);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '操作失败，请重试';
        setError(msg);
        return null;
      } finally {
        setIsActing(false);
      }
    },
    [projectId],
  );

  const start = useCallback(
    (activityId: string) => executeAction(activityId, { action: 'start' }),
    [executeAction],
  );

  const skip = useCallback(
    (activityId: string) => executeAction(activityId, { action: 'skip' }),
    [executeAction],
  );

  const complete = useCallback(
    (activityId: string, humanInput?: string) =>
      executeAction(activityId, { action: 'complete', humanInput }),
    [executeAction],
  );

  const bypass = useCallback(
    (activityId: string, option: ActivityActionRequest['bypassOption']) =>
      executeAction(activityId, { action: 'bypass', bypassOption: option }),
    [executeAction],
  );

  const clearError = useCallback(() => setError(null), []);

  return { isActing, error, start, skip, complete, bypass, clearError };
}