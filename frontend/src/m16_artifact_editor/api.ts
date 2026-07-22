/** M16 产出物编辑器 — API 调用 */

import { get, post, put, del } from '@/shared/api-client';
import apiClient from '@/shared/api-client';
import type {
  Artifact,
  ArtifactListItem,
  ArtifactVersion,
  RegenerateRequest,
  RegenerateResponse,
  CreateArtifactRequest,
  UpdateArtifactRequest,
} from './types';

/** 获取产出物列表 */
export async function fetchArtifactsAPI(projectId: string): Promise<ArtifactListItem[]> {
  return get<ArtifactListItem[]>(`/api/artifacts?project_id=${projectId}`);
}

/** 获取产出物详情 */
export async function fetchArtifactAPI(artifactId: string): Promise<Artifact> {
  return get<Artifact>(`/api/artifacts/${artifactId}`);
}

/** 更新产出物（创建新版本） */
export async function updateArtifactAPI(
  artifactId: string,
  data: UpdateArtifactRequest,
): Promise<Artifact> {
  return put<Artifact>(`/api/artifacts/${artifactId}`, data);
}

/** 软删除产出物 */
export async function deleteArtifactAPI(artifactId: string): Promise<void> {
  return del<void>(`/api/artifacts/${artifactId}`);
}

/** 获取版本历史 */
export async function fetchVersionsAPI(artifactId: string): Promise<ArtifactVersion[]> {
  return get<ArtifactVersion[]>(`/api/artifacts/${artifactId}/versions`);
}

/** 获取特定版本 */
export async function fetchVersionAPI(
  artifactId: string,
  version: number,
): Promise<ArtifactVersion> {
  return get<ArtifactVersion>(`/api/artifacts/${artifactId}/versions/${version}`);
}

/** 重新生成产出物（M10 异常恢复） */
export async function regenerateArtifactAPI(
  data: RegenerateRequest,
): Promise<RegenerateResponse> {
  return post<RegenerateResponse>(`/api/recovery/regenerate/${data.artifactId}`, {
    reason: data.reason,
    instructions: data.instructions,
  });
}

/** 上传附件 */
export async function uploadAttachmentAPI(
  artifactId: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Artifact> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<{ data: Artifact }>(
    `/api/artifacts/${artifactId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded, progressEvent.total);
        }
      },
    },
  );

  return response.data.data;
}

/** 删除附件 */
export async function deleteAttachmentAPI(
  artifactId: string,
  attachmentId: string,
): Promise<void> {
  return del<void>(`/api/artifacts/${artifactId}/attachments/${attachmentId}`);
}

/** 创建产出物 */
export async function createArtifactAPI(data: CreateArtifactRequest): Promise<Artifact> {
  return post<Artifact>('/api/artifacts', data);
}