/** M16 产出物编辑器 — 模块入口页面 */

import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedPageWrapper, itemVariants } from '@/shared/components/AnimatedPageWrapper';
import { useArtifactDetail } from './hooks/useArtifacts';
import { useVersionDiff } from './hooks/useArtifacts';
import { ArtifactList } from './components/ArtifactList';
import { ArtifactViewer } from './components/ArtifactViewer';
import { ArtifactEditor } from './components/ArtifactEditor';
import { VersionHistory } from './components/VersionHistory';
import { VersionDiff } from './components/VersionDiff';
import { AttachmentManager } from './components/AttachmentManager';
import { RegenerateButton } from './components/RegenerateButton';
import type { Artifact, RegenerateResponse } from './types';

/**
 * 产出物列表页：/projects/:id/artifacts
 */
export function ArtifactListPage(): React.ReactElement {
  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <motion.div variants={itemVariants}>
          <ArtifactList />
        </motion.div>
      </div>
    </AnimatedPageWrapper>
  );
}

/**
 * 产出物详情/编辑页：/projects/:id/artifacts/:artifactId
 */
export function ArtifactDetailPage(): React.ReactElement {
  const { artifactId } = useParams<{ artifactId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { artifact, isLoading, error, reload } = useArtifactDetail(artifactId ?? '');
  const { diff, isComparing, diffError, compareVersions, clearDiff } = useVersionDiff(artifactId ?? '');

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setSearchParams({ edit: 'true' }, { replace: true });
  }, [setSearchParams]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSaved = useCallback((_updated: Artifact) => {
    setIsEditing(false);
    setSearchParams({}, { replace: true });
    reload();
  }, [reload, setSearchParams]);

  const handleRegenerated = useCallback((_response: RegenerateResponse) => {
    reload();
  }, [reload]);

  const handleCompare = useCallback(
    (oldVersion: number, newVersion: number) => {
      void compareVersions(oldVersion, newVersion);
    },
    [compareVersions],
  );

  if (isLoading) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
            <p className="mt-3 text-sm text-slate-400">加载产出物详情...</p>
          </div>
        </div>
      </AnimatedPageWrapper>
    );
  }

  if (error) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 flex items-center justify-center py-20">
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
      </AnimatedPageWrapper>
    );
  }

  if (!artifact) {
    return (
      <AnimatedPageWrapper className="bg-deep-base">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-6 text-center py-20">
          <p className="text-sm text-slate-500">产出物不存在</p>
        </div>
      </AnimatedPageWrapper>
    );
  }

  return (
    <AnimatedPageWrapper className="bg-deep-base">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* 页面标题 */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-100">
            产出物详情
          </h1>
          <RegenerateButton
            artifactId={artifact.id}
            artifactName={artifact.name}
            onRegenerated={handleRegenerated}
          />
        </motion.div>

        {/* 主内容：查看器或编辑器 */}
        <motion.div variants={itemVariants} className="mb-6">
          {isEditing ? (
            <ArtifactEditor
              artifact={artifact}
              onSaved={handleSaved}
              onCancel={handleCancelEdit}
            />
          ) : (
            <ArtifactViewer
              artifact={artifact}
              onEdit={handleEdit}
            />
          )}
        </motion.div>

        {/* 版本对比视图 */}
        {isComparing && (
          <motion.div variants={itemVariants} className="mb-6 flex items-center justify-center py-8">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </motion.div>
        )}
        {diffError && (
          <motion.div variants={itemVariants} className="mb-6 rounded-md bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{diffError}</p>
          </motion.div>
        )}
        {diff && (
          <motion.div variants={itemVariants} className="mb-6">
            <VersionDiff diff={diff} onClose={clearDiff} />
          </motion.div>
        )}

        {/* 底部双栏：版本历史 + 附件管理 */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <VersionHistory
            artifactId={artifact.id}
            currentVersion={artifact.currentVersion}
            onCompare={handleCompare}
          />
          <AttachmentManager
            artifactId={artifact.id}
            attachments={artifact.attachments ?? []}
            onAttachmentsChanged={reload}
          />
        </motion.div>
      </div>
    </AnimatedPageWrapper>
  );
}