/** M14b ActivityList — 活动列表（含交互操作） */

import type { FC } from 'react';
import { useState, useCallback } from 'react';
import type { Activity } from '../types';
import { useActivityActions } from '../hooks/useActivityActions';
import ActivityInteraction from './ActivityInteraction';
import HumanInputModal from './HumanInputModal';

interface ActivityListProps {
  projectId: string;
  activities: Activity[];
  onActivityChange: () => void;
}

const ActivityList: FC<ActivityListProps> = ({ projectId, activities, onActivityChange }) => {
  const { isActing, error, start, skip, complete, bypass } = useActivityActions(projectId);

  // 人工输入弹窗状态
  const [humanInputActivity, setHumanInputActivity] = useState<Activity | null>(null);

  const handleStart = useCallback(
    async (activityId: string) => {
      await start(activityId);
      onActivityChange();
    },
    [start, onActivityChange],
  );

  const handleSkip = useCallback(
    async (activityId: string) => {
      await skip(activityId);
      onActivityChange();
    },
    [skip, onActivityChange],
  );

  const handleComplete = useCallback(
    (activityId: string) => {
      const activity = activities.find((a) => a.id === activityId);
      if (activity) {
        setHumanInputActivity(activity);
      }
    },
    [activities],
  );

  const handleHumanSubmit = useCallback(
    async (input: string) => {
      if (humanInputActivity) {
        await complete(humanInputActivity.id, input);
        setHumanInputActivity(null);
        onActivityChange();
      }
    },
    [humanInputActivity, complete, onActivityChange],
  );

  const handleBypass = useCallback(
    async (activityId: string) => {
      await bypass(activityId, 'skip_once');
      onActivityChange();
    },
    [bypass, onActivityChange],
  );

  const handleHumanBypass = useCallback(
    async (option: 'skip_once' | 'auto_until_error' | 'let_agent_decide') => {
      if (humanInputActivity) {
        await bypass(humanInputActivity.id, option);
        setHumanInputActivity(null);
        onActivityChange();
      }
    },
    [humanInputActivity, bypass, onActivityChange],
  );

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        当前阶段暂无活动
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 错误提示 */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* 活动列表 */}
      {activities.map((activity) => (
        <ActivityInteraction
          key={activity.id}
          activity={activity}
          isActing={isActing}
          onStart={handleStart}
          onSkip={handleSkip}
          onComplete={handleComplete}
          onBypass={handleBypass}
        />
      ))}

      {/* 人工输入弹窗 */}
      <HumanInputModal
        isOpen={humanInputActivity !== null}
        activityName={humanInputActivity?.name ?? ''}
        prompt="请提供您的输入或决策，以帮助 Agent 继续推进该活动。"
        onSubmit={handleHumanSubmit}
        onBypass={handleHumanBypass}
        onClose={() => setHumanInputActivity(null)}
      />
    </div>
  );
};

export default ActivityList;