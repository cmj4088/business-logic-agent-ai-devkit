import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectFormData, FormErrors, ComplexityPreview } from '../types';
import { createProjectAPI } from '../api';

function determineComplexity(formData: Partial<ProjectFormData>): ComplexityPreview {
  const { industry, team_size } = formData;

  if (industry && ['医疗器械', '汽车电子', '航空'].includes(industry)) {
    return {
      tier: 'full',
      reason: `${industry}行业需要完整合规流程`,
      activity_count: 34,
      estimated_duration: '6-12 个月',
    };
  }
  if (team_size !== undefined && team_size <= 3) {
    return {
      tier: 'lite',
      reason: '团队规模较小，建议轻量模式',
      activity_count: 24,
      estimated_duration: '1-3 个月',
    };
  }
  return {
    tier: 'standard',
    reason: '标准产品开发流程',
    activity_count: 31,
    estimated_duration: '3-6 个月',
  };
}

function validateForm(data: Partial<ProjectFormData>): FormErrors {
  const errors: FormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = '产品名称至少需要2个字符';
  }
  if (data.name && data.name.length > 50) {
    errors.name = '产品名称不能超过50个字符';
  }
  if (data.target_weeks !== undefined && (data.target_weeks < 1 || data.target_weeks > 52)) {
    errors.target_weeks = '请在1-52周之间选择';
  }
  if (data.team_size !== undefined && data.team_size < 1) {
    errors.team_size = '团队规模至少1人';
  }
  if (data.budget_limit !== undefined && data.budget_limit < 0) {
    errors.budget_limit = '预算不能为负数';
  }

  return errors;
}

export function useProjectCreation(preselectedTemplate?: string) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<ProjectFormData>>({
    name: '',
    template_id: preselectedTemplate ?? 'standard_ipd_v3',
    target_weeks: 8,
    team_size: 5,
    budget_limit: 100000,
    industry: '消费电子',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const complexityPreview = determineComplexity(formData);

  const updateField = useCallback(
    <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        setErrors(validateForm(next));
        return next;
      });
      setSubmitError(null);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const project = await createProjectAPI(formData as ProjectFormData);
      navigate(`/projects/${project.id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('创建项目失败，请检查网络连接后重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  return {
    formData,
    errors,
    isSubmitting,
    submitError,
    complexityPreview,
    updateField,
    handleSubmit,
  };
}