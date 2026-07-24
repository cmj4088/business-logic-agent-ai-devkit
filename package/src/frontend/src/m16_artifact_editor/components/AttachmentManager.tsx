/** M16 产出物编辑器 — 附件管理组件 */

import { useState, useCallback, useRef } from 'react';
import type { Attachment, UploadProgress } from '../types';
import { uploadAttachmentAPI, deleteAttachmentAPI } from '../api';

interface AttachmentManagerProps {
  /** 产出物 ID */
  artifactId: string;
  /** 附件列表 */
  attachments: Attachment[];
  /** 附件变更回调 */
  onAttachmentsChanged: () => void;
}

/**
 * 附件管理组件，支持上传（带进度条）、下载、删除。
 */
export function AttachmentManager({
  artifactId,
  attachments = [],
  onAttachmentsChanged,
}: AttachmentManagerProps): React.ReactElement {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);
      setUploadProgress({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
      });

      try {
        await uploadAttachmentAPI(artifactId, file, (loaded, total) => {
          setUploadProgress({
            fileName: file.name,
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        });
        onAttachmentsChanged();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '附件上传失败';
        setError(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        // 重置 input 以便重复上传同名文件
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [artifactId, onAttachmentsChanged],
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      setDeleteId(attachmentId);
      setError(null);

      try {
        await deleteAttachmentAPI(artifactId, attachmentId);
        onAttachmentsChanged();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '附件删除失败';
        setError(message);
      } finally {
        setDeleteId(null);
      }
    },
    [artifactId, onAttachmentsChanged],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-lg border border-deep-border bg-deep-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">
          附件
          {attachments.length > 0 && (
            <span className="ml-1.5 text-slate-400 font-normal">({attachments.length})</span>
          )}
        </h3>
        <label className="cursor-pointer rounded-lg border border-deep-border bg-deep-surface px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-deep-card transition-colors">
          <svg className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          上传附件
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => void handleUpload(e)}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* 上传进度条 */}
      {uploadProgress && (
        <div className="mb-3 rounded-md bg-indigo-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-600 truncate max-w-[70%]">
              {uploadProgress.fileName}
            </span>
            <span className="text-xs font-medium text-indigo-600">
              {uploadProgress.percentage}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
          </p>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* 附件列表 */}
      {attachments.length === 0 && !isUploading ? (
        <p className="text-xs text-slate-400 py-2">暂无附件</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {att.fileName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(att.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <a
                  href={att.downloadUrl}
                  download={att.fileName}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  title="下载"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete(att.id)}
                  disabled={deleteId === att.id}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="删除"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}