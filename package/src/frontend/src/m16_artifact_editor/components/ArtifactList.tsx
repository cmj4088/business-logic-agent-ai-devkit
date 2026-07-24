/** M16 产出物编辑器 — 产出物列表（按阶段分组） */

import { useNavigate, useParams } from 'react-router-dom';
import { useArtifacts } from '../hooks/useArtifacts';
import { AIBadge } from './AIBadge';
import { ARTIFACT_TYPE_LABELS } from '../types';

interface ArtifactListProps {
  /** 项目名称（用于显示） */
  projectName?: string;
}

/**
 * 产出物列表，按 IPD 阶段分组显示。
 * 每个产出物显示名称、类型、版本号、AI 标识以及操作按钮。
 */
export function ArtifactList({ projectName }: ArtifactListProps): React.ReactElement {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stagedArtifacts, isLoading, error, reload } = useArtifacts(projectId ?? '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
          <p className="mt-3 text-sm text-slate-400">加载产出物列表...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg border border-deep-border px-4 py-2 text-sm font-medium text-slate-400 hover:bg-deep-surface transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const totalCount = stagedArtifacts.reduce((sum, s) => sum + s.artifacts.length, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            产出物
            {projectName && (
              <span className="ml-2 text-slate-500 font-normal">— {projectName}</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-400">共 {totalCount} 个产出物</p>
        </div>
      </div>

      {/* 按阶段分组 */}
      {stagedArtifacts.map((group) => (
        <div key={group.stage} className="rounded-lg border border-deep-border bg-deep-card overflow-hidden">
          {/* 阶段标题 */}
          <div className="border-b border-deep-border bg-deep-surface px-4 py-2.5">
            <h3 className="text-sm font-semibold text-slate-200">
              {group.stageLabel}
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({group.artifacts.length})
              </span>
            </h3>
          </div>

          {/* 产出物列表 */}
          {group.artifacts.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-500">暂无产出物</p>
            </div>
          ) : (
            <div className="divide-y divide-deep-border">
              {group.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-deep-surface transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 类型图标 */}
                    <span className="text-lg flex-shrink-0">
                      {artifact.type === 'document' ? '📝' :
                       artifact.type === 'spreadsheet' ? '📊' :
                       artifact.type === 'presentation' ? '📽️' :
                       artifact.type === 'diagram' ? '📐' : '📄'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {artifact.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          v{artifact.currentVersion}
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">
                          {ARTIFACT_TYPE_LABELS[artifact.type]}
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">
                          {new Date(artifact.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <AIBadge
                      aiGenerated={artifact.aiGenerated}
                      aiSource={artifact.aiSource}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/artifacts/${artifact.id}`)}
                      className="rounded-lg border border-deep-border px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-deep-surface hover:text-slate-200 transition-colors"
                    >
                      查看
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/artifacts/${artifact.id}?edit=true`)}
                      className="rounded-lg border border-deep-border px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-deep-surface hover:text-slate-200 transition-colors"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}