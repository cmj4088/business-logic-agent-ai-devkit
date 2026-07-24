/** M16 产出物编辑器 — 产出物数据 Hook */

import { useState, useEffect, useCallback } from 'react';
import type { Artifact, ArtifactListItem, StagedArtifacts, VersionDiff } from '../types';
import { STAGE_LABELS } from '../types';
import { fetchArtifactsAPI, fetchArtifactAPI, fetchVersionAPI } from '../api';
import type { IPDStage } from '@/shared/types';

interface UseArtifactsReturn {
  /** 按阶段分组的产出物列表 */
  stagedArtifacts: StagedArtifacts[];
  /** 是否加载中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新加载列表 */
  reload: () => void;
}

/** 产出物列表 Hook */
export function useArtifacts(projectId: string): UseArtifactsReturn {
  const [artifacts, setArtifacts] = useState<ArtifactListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtifacts = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchArtifactsAPI(projectId)
      .then((data) => {
        setArtifacts(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '加载产出物列表失败';
        setError(message);
        setIsLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  // 按阶段分组
  const stagedArtifacts: StagedArtifacts[] = (() => {
    const stageOrder: IPDStage[] = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];
    const grouped = new Map<IPDStage, ArtifactListItem[]>();

    for (const artifact of artifacts) {
      const existing = grouped.get(artifact.stage);
      if (existing) {
        existing.push(artifact);
      } else {
        grouped.set(artifact.stage, [artifact]);
      }
    }

    return stageOrder.map((stage) => ({
      stage,
      stageLabel: STAGE_LABELS[stage],
      artifacts: grouped.get(stage) ?? [],
    }));
  })();

  return {
    stagedArtifacts,
    isLoading,
    error,
    reload: loadArtifacts,
  };
}

interface UseArtifactDetailReturn {
  /** 产出物详情 */
  artifact: Artifact | null;
  /** 是否加载中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新加载 */
  reload: () => void;
}

/** 产出物详情 Hook */
export function useArtifactDetail(artifactId: string): UseArtifactDetailReturn {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchArtifactAPI(artifactId)
      .then((data) => {
        setArtifact(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '加载产出物详情失败';
        setError(message);
        setIsLoading(false);
      });
  }, [artifactId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    artifact,
    isLoading,
    error,
    reload: load,
  };
}

interface UseVersionDiffReturn {
  /** 版本对比结果 */
  diff: VersionDiff | null;
  /** 是否正在对比 */
  isComparing: boolean;
  /** 对比错误 */
  diffError: string | null;
  /** 执行版本对比 */
  compareVersions: (oldVersion: number, newVersion: number) => Promise<void>;
  /** 清除对比结果 */
  clearDiff: () => void;
}

/** 版本对比 Hook */
export function useVersionDiff(artifactId: string): UseVersionDiffReturn {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  /** 简单行级 diff 算法 */
  function computeDiff(oldText: string, newText: string): VersionDiff['lines'] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const lines: VersionDiff['lines'] = [];

    let oldIdx = 0;
    let newIdx = 0;

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      if (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
        lines.push({
          type: 'unchanged',
          lineNumber: newIdx + 1,
          content: oldLines[oldIdx],
        });
        oldIdx++;
        newIdx++;
      } else if (newIdx < newLines.length && oldIdx < oldLines.length) {
        // 查找旧行在新行中的位置
        const nextOldInNew = newLines.indexOf(oldLines[oldIdx], newIdx);
        const nextNewInOld = oldLines.indexOf(newLines[newIdx], oldIdx);

        if (nextOldInNew > newIdx && (nextNewInOld === -1 || nextOldInNew - newIdx <= nextNewInOld - oldIdx)) {
          // 新版本有新增行
          for (let i = newIdx; i < nextOldInNew; i++) {
            lines.push({
              type: 'added',
              lineNumber: i + 1,
              content: newLines[i],
            });
          }
          newIdx = nextOldInNew;
        } else if (nextNewInOld > oldIdx) {
          // 旧版本有删除行
          for (let i = oldIdx; i < nextNewInOld; i++) {
            lines.push({
              type: 'removed',
              lineNumber: i + 1,
              content: oldLines[i],
            });
          }
          oldIdx = nextNewInOld;
        } else {
          // 视为替换
          lines.push({
            type: 'removed',
            lineNumber: oldIdx + 1,
            content: oldLines[oldIdx],
          });
          lines.push({
            type: 'added',
            lineNumber: newIdx + 1,
            content: newLines[newIdx],
          });
          oldIdx++;
          newIdx++;
        }
      } else if (oldIdx < oldLines.length) {
        lines.push({
          type: 'removed',
          lineNumber: oldIdx + 1,
          content: oldLines[oldIdx],
        });
        oldIdx++;
      } else {
        lines.push({
          type: 'added',
          lineNumber: newIdx + 1,
          content: newLines[newIdx],
        });
        newIdx++;
      }
    }

    return lines;
  }

  const compareVersions = useCallback(
    async (oldVersion: number, newVersion: number) => {
      setIsComparing(true);
      setDiffError(null);
      setDiff(null);

      try {
        const [oldData, newData] = await Promise.all([
          fetchVersionAPI(artifactId, oldVersion),
          fetchVersionAPI(artifactId, newVersion),
        ]);

        const diffLines = computeDiff(oldData.content, newData.content);

        setDiff({
          oldVersion: oldData.version,
          newVersion: newData.version,
          lines: diffLines,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '版本对比失败';
        setDiffError(message);
      } finally {
        setIsComparing(false);
      }
    },
    [artifactId],
  );

  const clearDiff = useCallback(() => {
    setDiff(null);
    setDiffError(null);
  }, []);

  return {
    diff,
    isComparing,
    diffError,
    compareVersions,
    clearDiff,
  };
}