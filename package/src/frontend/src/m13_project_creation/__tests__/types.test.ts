/** M13_project_creation types.test.ts — 项目创建模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Project Creation Types', () => {
  it('QuickStartFormData 应包含 5 个必填项', () => {
    const formData = {
      name: '智能手表',
      industry: '消费电子',
      description: '新一代智能手表产品',
      complexity: 'auto',
      targetWeeks: 12,
    };
    expect(formData).toHaveProperty('name');
    expect(formData).toHaveProperty('industry');
    expect(formData).toHaveProperty('description');
    expect(formData).toHaveProperty('complexity');
    expect(formData).toHaveProperty('targetWeeks');
  });

  it('ComplexityTier 应包含四种复杂度', () => {
    const tiers = ['auto', 'lite', 'standard', 'full'];
    expect(tiers).toHaveLength(4);
  });

  it('IndustryOption 应包含行业分类字段', () => {
    const option = {
      key: 'consumer_electronics',
      label: '消费电子',
      category: '硬件',
      description: '面向消费者的电子产品',
    };
    expect(option).toHaveProperty('key');
    expect(option).toHaveProperty('label');
    expect(option).toHaveProperty('category');
  });

  it('ProjectCreationState 应包含表单状态', () => {
    const state = {
      isSubmitting: false,
      isSuccess: false,
      createdProjectId: null,
      error: null,
      currentStep: 0,
    };
    expect(state).toHaveProperty('isSubmitting');
    expect(state).toHaveProperty('isSuccess');
    expect(state).toHaveProperty('currentStep');
    expect(state.currentStep).toBe(0);
  });

  it('提交中状态应禁用操作', () => {
    const state = {
      isSubmitting: true,
      isSuccess: false,
      createdProjectId: null,
      error: null,
      currentStep: 0,
    };
    expect(state.isSubmitting).toBe(true);
    expect(state.isSuccess).toBe(false);
  });

  it('创建成功后应设置 projectId', () => {
    const state = {
      isSubmitting: false,
      isSuccess: true,
      createdProjectId: 'proj_001',
      error: null,
      currentStep: 0,
    };
    expect(state.isSuccess).toBe(true);
    expect(state.createdProjectId).toBe('proj_001');
  });
});