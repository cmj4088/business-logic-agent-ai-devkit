/** M16 产出物编辑器 — 产出物查看器（Markdown 渲染） */

import { useMemo } from 'react';
import { renderMarkdown } from '../markdown';
import { AIBadge } from './AIBadge';
import type { Artifact } from '../types';
import { ARTIFACT_TYPE_LABELS, ARTIFACT_STATUS_LABELS, STAGE_LABELS } from '../types';

interface ArtifactViewerProps {
  /** 产出物数据 */
  artifact: Artifact;
  /** 编辑按钮回调 */
  onEdit?: () => void;
}

/**
 * 产出物查看器，将 Markdown 内容渲染为 HTML 显示。
 * 同时显示产出物的元数据信息（类型、状态、阶段、AI 标识等）。
 */
export function ArtifactViewer({ artifact, onEdit }: ArtifactViewerProps): React.ReactElement {
  const renderedHtml = useMemo(() => renderMarkdown(artifact.content), [artifact.content]);

  return (
    <div className="space-y-4">
      {/* 产出物元信息头部 */}
      <div className="rounded-lg border border-deep-border bg-deep-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{artifact.name}</h2>
            {artifact.description && (
              <p className="mt-1 text-sm text-slate-400">{artifact.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AIBadge aiGenerated={artifact.aiGenerated} aiSource={artifact.aiSource} />
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-deep-border px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-deep-surface transition-colors"
              >
                编辑
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-deep-surface px-2 py-0.5 text-slate-400">
            {ARTIFACT_TYPE_LABELS[artifact.type]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-deep-surface px-2 py-0.5 text-slate-400">
            {STAGE_LABELS[artifact.stage]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-deep-surface px-2 py-0.5 text-slate-400">
            {ARTIFACT_STATUS_LABELS[artifact.status]}
          </span>
          <span className="text-slate-500">v{artifact.currentVersion}</span>
          <span className="text-slate-500">更新于 {new Date(artifact.updatedAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      {/* Markdown 渲染内容 */}
      <div className="rounded-lg border border-deep-border bg-deep-card p-6">
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}