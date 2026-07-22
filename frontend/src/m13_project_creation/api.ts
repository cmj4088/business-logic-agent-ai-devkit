import { get, post } from '@/shared/api-client';
import type { Project } from '@/shared/types';
import type { ProjectFormData } from './types';

export interface StageInfoData {
  stages: string[];
  gates: Record<string, string[]>;
}

export async function createProjectAPI(data: ProjectFormData): Promise<Project> {
  return post<Project>('/api/projects', data);
}

export async function getStageInfoAPI(): Promise<StageInfoData> {
  return get<StageInfoData>('/api/workflows/stages');
}