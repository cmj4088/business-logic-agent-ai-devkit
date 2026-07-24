import type { ComplexityTier } from '@/shared/types';

export interface ProjectFormData {
  name: string;
  template_id: string;
  target_weeks: number;
  team_size: number;
  budget_limit: number;
  industry: string;
  description: string;
}

export interface FormErrors {
  name?: string;
  target_weeks?: string;
  team_size?: string;
  budget_limit?: string;
}

export interface ComplexityPreview {
  tier: ComplexityTier;
  reason: string;
  activity_count: number;
  estimated_duration: string;
}