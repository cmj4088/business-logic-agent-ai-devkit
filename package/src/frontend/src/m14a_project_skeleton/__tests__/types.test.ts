/** M14a types.test.ts — 类型常量和数据验证测试 */

import { describe, it, expect } from 'vitest';
import {
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  ACTIVITY_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
} from '../types';

describe('STAGE_LABELS', () => {
  it('应包含全部 6 个 IPD 阶段', () => {
    const stages = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];
    for (const stage of stages) {
      expect(STAGE_LABELS).toHaveProperty(stage);
    }
  });

  it('每个阶段标签应为非空字符串', () => {
    for (const [, label] of Object.entries(STAGE_LABELS)) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('STAGE_DESCRIPTIONS', () => {
  it('应包含全部 6 个 IPD 阶段描述', () => {
    const stages = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];
    for (const stage of stages) {
      expect(STAGE_DESCRIPTIONS).toHaveProperty(stage);
    }
  });

  it('每个阶段描述应为非空字符串', () => {
    for (const [, desc] of Object.entries(STAGE_DESCRIPTIONS)) {
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});

describe('ACTIVITY_STATUS_LABELS', () => {
  it('应包含全部 4 种活动状态', () => {
    expect(ACTIVITY_STATUS_LABELS).toHaveProperty('pending');
    expect(ACTIVITY_STATUS_LABELS).toHaveProperty('in_progress');
    expect(ACTIVITY_STATUS_LABELS).toHaveProperty('completed');
    expect(ACTIVITY_STATUS_LABELS).toHaveProperty('skipped');
  });
});

describe('PROJECT_STATUS_LABELS', () => {
  it('应包含全部 4 种项目状态', () => {
    expect(PROJECT_STATUS_LABELS).toHaveProperty('active');
    expect(PROJECT_STATUS_LABELS).toHaveProperty('paused');
    expect(PROJECT_STATUS_LABELS).toHaveProperty('completed');
    expect(PROJECT_STATUS_LABELS).toHaveProperty('archived');
  });
});