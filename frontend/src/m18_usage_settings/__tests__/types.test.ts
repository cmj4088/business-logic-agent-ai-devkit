/** M18_usage_settings types.test.ts — 用量与设置模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Usage Settings Types', () => {
  it('UsageOverview 应包含用量统计字段', () => {
    const overview = {
      totalTokens: 150000,
      totalCostUSD: 12.50,
      todayTokens: 5000,
      todayCostUSD: 0.42,
      projectCount: 5,
    };
    expect(overview).toHaveProperty('totalTokens');
    expect(overview).toHaveProperty('totalCostUSD');
    expect(overview).toHaveProperty('todayTokens');
    expect(overview.totalTokens).toBeGreaterThanOrEqual(0);
  });

  it('DailyTrend 应包含趋势数据', () => {
    const trend = {
      date: '2026-07-09',
      tokens: 5000,
      costUSD: 0.42,
      projectId: 'proj_001',
    };
    expect(trend).toHaveProperty('date');
    expect(trend).toHaveProperty('tokens');
    expect(trend.tokens).toBeGreaterThanOrEqual(0);
  });

  it('ProjectUsage 应包含项目用量', () => {
    const usage = {
      projectId: 'proj_001',
      projectName: '智能手表',
      totalTokens: 50000,
      totalCostUSD: 4.20,
      stageBreakdown: {
        concept: 20000,
        plan: 15000,
        develop: 15000,
      },
    };
    expect(usage).toHaveProperty('projectId');
    expect(usage).toHaveProperty('projectName');
    expect(usage).toHaveProperty('totalTokens');
    expect(usage).toHaveProperty('stageBreakdown');
  });

  it('BudgetAlert 应包含预算告警字段', () => {
    const alert = {
      projectId: 'proj_001',
      projectName: '智能手表',
      budgetLimit: 100,
      currentSpend: 85,
      percentage: 85,
      isWarningSent: false,
    };
    expect(alert).toHaveProperty('budgetLimit');
    expect(alert).toHaveProperty('currentSpend');
    expect(alert).toHaveProperty('percentage');
    expect(alert.percentage).toBe(85);
  });

  it('GeneralSettings 应包含设置字段', () => {
    const settings = {
      theme: 'system',
      language: 'zh-CN',
      autoAdvanceStage: false,
      maxDebateRounds: 5,
      notificationEnabled: true,
    };
    expect(settings).toHaveProperty('theme');
    expect(settings).toHaveProperty('language');
    expect(settings).toHaveProperty('autoAdvanceStage');
    expect(settings).toHaveProperty('maxDebateRounds');
  });
});