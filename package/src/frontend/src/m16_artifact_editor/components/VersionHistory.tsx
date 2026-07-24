/** M16 产出物编辑器 — 版本历史列表 */

import { useState, useEffect, useCallback } from 'react';
import type { ArtifactVersion } from '../types';
import { fetchVersionsAPI } from '../api';
import { AIBadge } from './AIBadge';

interface VersionHistoryProps {
  /** 产出物 ID */
  artifactId: string;
  /** 当前版本号 */
  currentVersion: number;
  /** 选择版本对比回调 */
  onCompare?: (oldVersion: number, newVersion: number) => void;
}

/**
 * 版本历史列表，显示产出物的所有历史版本。
 * 支持选择两个版本进行对比。
 */
export function VersionHistory({
  artifactId,
  currentVersion,
  onCompare,
}: VersionHistoryProps): React.ReactElement {
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  const loadVersions = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetchVersionsAPI(artifactId)
      .then((data) => {
        setVersions(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '加载版本历史失败';
        setError(message);
        setIsLoading(false);
      });
  }, [artifactId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleToggleVersion = (version: number): void => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  const handleCompare = (): void => {
    if (selectedVersions.length === 2 && onCompare) {
      const [a, b] = selectedVersions;
      onCompare(Math.min(a, b), Math.max(a, b));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-deep-border bg-deep-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">
          版本历史
          <span className="ml-1.5 text-xs font-normal text-slate-500">
            ({versions.length})
          </span>
        </h3>
        {selectedVersions.length === 2 && (
          <button
            type="button"
            onClick={handleCompare}
            className="rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-3 py-1 text-xs font-medium text-neon-blue hover:bg-neon-blue/20 transition-colors"
          >
            对比选中版本
          </button>
        )}
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">暂无版本历史</p>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => {
            const isSelected = selectedVersions.includes(v.version);
            const isCurrent = v.version === currentVersion;

            return (
              <button
                key={v.version}
                type="button"
                onClick={() => handleToggleVersion(v.version)}
                className={`w-full text-left rounded-md px-3 py-2.5 transition-colors ${
                  isSelected
                    ? 'bg-neon-blue/10 border border-neon-blue/30'
                    : 'bg-deep-surface border border-transparent hover:bg-deep-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-semibold ${
                      isCurrent ? 'text-neon-blue' : 'text-slate-400'
                    }`}>
                      v{v.version}
                    </span>
                    {isCurrent && (
                      <span className="text-xs rounded bg-neon-blue/10 px-1.5 py-0.5 text-neon-blue font-medium">
                        当前
                      </span>
                    )}
                    {v.aiGenerated && (
                      <AIBadge
                        aiGenerated={v.aiGenerated}
                        aiSource={v.aiSource}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(v.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {v.changeSummary}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}