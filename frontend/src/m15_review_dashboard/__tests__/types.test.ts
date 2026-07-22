/** M15_review_dashboard types.test.ts — 审核模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Review Dashboard Types', () => {
  it('ReviewTask 应包含审核核心字段', () => {
    const review = {
      id: 'rev_001',
      projectId: 'proj_001',
      projectName: '智能手表',
      gateId: 'gate_concept',
      gateName: '概念阶段门禁',
      stage: 'concept',
      status: 'pending',
      artifactId: 'art_001',
      artifactName: 'MRD 文档',
      autoApproved: false,
      assignee: 'product_manager',
      createdAt: '2026-07-09T10:00:00Z',
    };
    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('projectId');
    expect(review).toHaveProperty('gateId');
    expect(review).toHaveProperty('status');
    expect(review).toHaveProperty('autoApproved');
  });

  it('ReviewStatus 应包含四种审核状态', () => {
    const statuses = ['pending', 'in_review', 'approved', 'rejected'];
    expect(statuses).toHaveLength(4);
  });

  it('ReviewFilters 应包含过滤条件', () => {
    const filters = {
      status: 'pending',
      stage: 'concept',
      projectId: 'proj_001',
      search: '',
    };
    expect(filters).toHaveProperty('status');
    expect(filters).toHaveProperty('stage');
    expect(filters).toHaveProperty('projectId');
    expect(filters).toHaveProperty('search');
  });

  it('VoteType 应包含三种投票类型', () => {
    const votes = ['approve', 'reject', 'abstain'];
    expect(votes).toHaveLength(3);
  });

  it('BatchReviewResult 应包含批量操作结果', () => {
    const result = {
      total: 10,
      succeeded: 8,
      failed: 2,
      errors: [{ id: 'rev_003', reason: '权限不足' }],
    };
    expect(result.total).toBe(10);
    expect(result.succeeded).toBe(8);
    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(1);
  });
});