/** M14a 项目详情数据 Hook */

import { useState, useEffect, useCallback } from 'react';
import type { ProjectDetail, StageResponse, Activity, GateStatusData } from '../types';
import { fetchProjectDetail, fetchStageDetail, fetchActivities, fetchGateStatus } from '../api';

interface ProjectDetailState {
  project: ProjectDetail | null;
  stageData: StageResponse | null;
  activities: Activity[];
  gateStatuses: GateStatusData[];
  isLoading: boolean;
  isNotFound: boolean;
  error: string | null;
}

interface ProjectDetailActions {
  refresh: () => Promise<void>;
}

export function useProjectDetail(projectId: string): ProjectDetailState & ProjectDetailActions {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [stageData, setStageData] = useState<StageResponse | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gateStatuses, setGateStatuses] = useState<GateStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setIsNotFound(false);
    setError(null);

    try {
      const [projectData, stageResult, activitiesData, gateData] = await Promise.all([
        fetchProjectDetail(projectId),
        fetchStageDetail(projectId),
        fetchActivities(projectId),
        fetchGateStatus(projectId),
      ]);

      setProject(projectData);
      setStageData(stageResult);
      setActivities(activitiesData);
      setGateStatuses(gateData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('加载项目详情失败，请检查网络连接后重试');
      }

      // 检查是否为 404
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 404) {
          setIsNotFound(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    project,
    stageData,
    activities,
    gateStatuses,
    isLoading,
    isNotFound,
    error,
    refresh: loadData,
  };
}