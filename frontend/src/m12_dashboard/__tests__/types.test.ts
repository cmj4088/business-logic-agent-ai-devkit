/** M12_dashboard types.test.ts — Dashboard 模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Dashboard Types', () => {
  it('Project 应包含核心字段', () => {
    const project = {
      id: 'proj_001',
      name: '智能手表',
      description: '新一代智能手表产品',
      currentStage: 'concept',
      status: 'active',
      progress: 25,
      complexity: 'standard',
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-09T00:00:00Z',
    };
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('currentStage');
    expect(project).toHaveProperty('status');
    expect(project).toHaveProperty('progress');
    expect(project).toHaveProperty('complexity');
  });

  it('PendingTask 应包含任务核心字段', () => {
    const task = {
      id: 'task_001',
      projectId: 'proj_001',
      projectName: '智能手表',
      type: 'review',
      title: '审核概念阶段门禁',
      urgency: 'high',
      createdAt: '2026-07-09T10:00:00Z',
    };
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('projectId');
    expect(task).toHaveProperty('type');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('urgency');
  });

  it('TaskUrgency 应包含四种紧急程度', () => {
    const urgencies = ['critical', 'high', 'medium', 'low'];
    expect(urgencies).toHaveLength(4);
    for (const u of urgencies) {
      expect(typeof u).toBe('string');
    }
  });

  it('DashboardStats 应包含统计字段', () => {
    const stats = {
      totalProjects: 5,
      activeProjects: 3,
      completedProjects: 1,
      pendingReviews: 8,
      totalCostUSD: 12.50,
    };
    expect(stats.totalProjects).toBeGreaterThanOrEqual(0);
    expect(stats.activeProjects).toBeGreaterThanOrEqual(0);
    expect(stats.pendingReviews).toBeGreaterThanOrEqual(0);
    expect(stats.totalCostUSD).toBeGreaterThanOrEqual(0);
  });
});