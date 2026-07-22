/** M16 产出物编辑器 — 类型定义 */

import type { IPDStage } from '@/shared/types';

/** 产出物状态 */
export type ArtifactStatus = 'draft' | 'review' | 'approved' | 'archived';

/** 产出物类型 */
export type ArtifactType = 'document' | 'spreadsheet' | 'presentation' | 'diagram' | 'other';

/** AI 生成来源信息 */
export interface AISource {
  /** 生成模型 */
  model: string;
  /** 生成时间 */
  generatedAt: string;
  /** 可信度评分 (0-100) */
  confidence: number;
  /** 生成原因/说明 */
  reason: string;
}

/** 附件信息 */
export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  downloadUrl: string;
}

/** 产出物版本 */
export interface ArtifactVersion {
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
  changeSummary: string;
  /** 是否为 AI 生成 */
  aiGenerated: boolean;
  /** AI 来源信息（仅 AI 生成时有值） */
  aiSource?: AISource;
}

/** 产出物基本信息 */
export interface Artifact {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: ArtifactType;
  status: ArtifactStatus;
  stage: IPDStage;
  /** 当前版本号 */
  currentVersion: number;
  /** 当前内容 */
  content: string;
  /** 是否为 AI 生成 */
  aiGenerated: boolean;
  /** AI 来源信息 */
  aiSource?: AISource;
  /** 附件列表 */
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

/** 产出物列表项（简化版） */
export interface ArtifactListItem {
  id: string;
  projectId: string;
  name: string;
  type: ArtifactType;
  status: ArtifactStatus;
  stage: IPDStage;
  currentVersion: number;
  aiGenerated: boolean;
  aiSource?: AISource;
  createdAt: string;
  updatedAt: string;
}

/** 按阶段分组的产出物 */
export interface StagedArtifacts {
  stage: IPDStage;
  stageLabel: string;
  artifacts: ArtifactListItem[];
}

/** 版本对比结果 */
export interface VersionDiff {
  /** 旧版本号 */
  oldVersion: number;
  /** 新版本号 */
  newVersion: number;
  /** 差异行列表 */
  lines: DiffLine[];
}

/** 差异行类型 */
export type DiffLineType = 'added' | 'removed' | 'unchanged';

/** 单行差异 */
export interface DiffLine {
  type: DiffLineType;
  lineNumber: number;
  content: string;
}

/** 附件上传进度 */
export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
}

/** 重新生成请求参数 */
export interface RegenerateRequest {
  artifactId: string;
  /** 重新生成原因 */
  reason: string;
  /** 可选的额外指令 */
  instructions?: string;
}

/** 重新生成响应 */
export interface RegenerateResponse {
  artifactId: string;
  newVersion: number;
  content: string;
  aiSource: AISource;
}

/** 创建产出物请求 */
export interface CreateArtifactRequest {
  projectId: string;
  name: string;
  description: string;
  type: ArtifactType;
  stage: IPDStage;
  content: string;
}

/** 更新产出物请求（创建新版本） */
export interface UpdateArtifactRequest {
  content: string;
  changeSummary: string;
}

/** IPD 阶段中文标签映射 */
export const STAGE_LABELS: Record<IPDStage, string> = {
  concept: '概念阶段',
  plan: '计划阶段',
  develop: '开发阶段',
  verify: '验证阶段',
  launch: '发布阶段',
  lifecycle: '生命周期阶段',
};

/** 产出物类型中文标签映射 */
export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  document: '文档',
  spreadsheet: '表格',
  presentation: '演示文稿',
  diagram: '图表',
  other: '其他',
};

/** 产出物状态中文标签映射 */
export const ARTIFACT_STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: '草稿',
  review: '评审中',
  approved: '已批准',
  archived: '已归档',
};