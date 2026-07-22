/** M16 产出物编辑器 — Markdown 编辑器（编辑 + 预览分屏） */

import { useState, useCallback, useMemo } from 'react';
import { renderMarkdown } from '../markdown';
import type { Artifact, UpdateArtifactRequest } from '../types';
import { updateArtifactAPI } from '../api';

interface ArtifactEditorProps {
  /** 产出物数据 */
  artifact: Artifact;
  /** 保存成功回调 */
  onSaved: (updated: Artifact) => void;
  /** 取消编辑回调 */
  onCancel: () => void;
}

/**
 * Markdown 编辑器，左侧为编辑区（textarea），右侧为实时预览。
 * 保存时创建新版本（changeSummary 必填）。
 */
export function ArtifactEditor({
  artifact,
  onSaved,
  onCancel,
}: ArtifactEditorProps): React.ReactElement {
  const [content, setContent] = useState(artifact.content);
  const [changeSummary, setChangeSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);

  const handleSave = useCallback(async () => {
    if (!changeSummary.trim()) {
      setSaveError('请填写变更说明');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const data: UpdateArtifactRequest = {
        content,
        changeSummary: changeSummary.trim(),
      };
      const updated = await updateArtifactAPI(artifact.id, data);
      onSaved(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '保存失败，请稍后重试';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [artifact.id, content, changeSummary, onSaved]);

  const hasChanges = content !== artifact.content;

  return (
    <div className="space-y-4">
      {/* 编辑器头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            编辑 — {artifact.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            编辑将创建新版本 v{artifact.currentVersion + 1}，原版本 v{artifact.currentVersion} 将被保留
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              showPreview
                ? 'border-neon-blue/30 bg-neon-blue/10 text-neon-blue'
                : 'border-deep-border text-slate-400 hover:bg-deep-surface'
            }`}
          >
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-deep-border px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-deep-surface transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !hasChanges || !changeSummary.trim()}
            className="rounded-lg bg-neon-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-neon-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存为新版本'}
          </button>
        </div>
      </div>

      {/* 变更说明 */}
      <div>
        <label htmlFor="change-summary" className="block text-sm font-medium text-slate-200 mb-1">
          变更说明 <span className="text-red-400">*</span>
        </label>
        <input
          id="change-summary"
          type="text"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          placeholder="简述本次变更内容..."
          maxLength={200}
          className="w-full rounded-lg border border-deep-border bg-deep-surface px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
        />
      </div>

      {/* 错误提示 */}
      {saveError && (
        <div className="rounded-md bg-red-500/10 px-4 py-2">
          <p className="text-sm text-red-400">{saveError}</p>
        </div>
      )}

      {/* 编辑 + 预览分屏 */}
      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* 编辑区 */}
        <div className="rounded-lg border border-deep-border bg-deep-card overflow-hidden">
          <div className="border-b border-deep-border bg-deep-surface px-4 py-2">
            <span className="text-xs font-medium text-slate-500">Markdown 编辑</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] resize-y border-0 bg-deep-card px-4 py-3 font-mono text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-0"
            placeholder="输入 Markdown 内容..."
            spellCheck={false}
          />
        </div>

        {/* 预览区 */}
        {showPreview && (
          <div className="rounded-lg border border-deep-border bg-deep-card overflow-hidden">
            <div className="border-b border-deep-border bg-deep-surface px-4 py-2">
              <span className="text-xs font-medium text-slate-500">预览</span>
            </div>
            <div
              className="px-4 py-3 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}