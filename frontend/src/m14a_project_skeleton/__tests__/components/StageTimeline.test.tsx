/** M14a StageTimeline.test.tsx — 阶段时间线组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StageTimeline from '../../components/StageTimeline';
import type { StageDetail } from '../../types';
import type { IPDStage } from '@/shared/types';

/** 创建全部 6 个阶段（status 决定阶段状态） */
function createAllStages(currentStage: IPDStage = 'develop'): StageDetail[] {
  const allStages: IPDStage[] = ['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle'];
  return allStages.map((stage) => {
    const stageIdx = allStages.indexOf(stage);
    const currentIdx = allStages.indexOf(currentStage);
    let status: 'completed' | 'current' | 'pending';
    if (stageIdx < currentIdx) status = 'completed';
    else if (stageIdx === currentIdx) status = 'current';
    else status = 'pending';
    return {
      stage,
      label: stage,
      description: '',
      status,
      startedAt: status !== 'pending' ? '2026-07-01T00:00:00Z' : null,
      completedAt: status === 'completed' ? '2026-07-03T00:00:00Z' : null,
    };
  });
}

describe('StageTimeline', () => {
  it('应渲染全部 6 个阶段（短标签名）', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    // 组件使用 STAGE_LABELS: 概念, 计划, 开发, 验证, 发布, 生命周期
    expect(screen.getByText('概念')).toBeInTheDocument();
    expect(screen.getByText('计划')).toBeInTheDocument();
    expect(screen.getByText('开发')).toBeInTheDocument();
    expect(screen.getByText('验证')).toBeInTheDocument();
    expect(screen.getByText('发布')).toBeInTheDocument();
    expect(screen.getByText('生命周期')).toBeInTheDocument();
  });

  it('已完成的阶段应显示 ✓ 图标', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    const checkMarks = screen.getAllByText('✓');
    // 概念和计划阶段已完成，应有 2 个 ✓
    expect(checkMarks.length).toBe(2);
  });

  it('未完成阶段应显示序号', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    // 开发阶段是第 3 个（索引 2），显示 3
    expect(screen.getByText('3')).toBeInTheDocument();
    // 验证是第 4 个，显示 4
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('应渲染阶段描述（来自 STAGE_DESCRIPTIONS 常量）', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    // 使用 STAGE_DESCRIPTIONS 中的描述
    expect(screen.getByText('市场分析、客户需求调研、产品概念定义')).toBeInTheDocument();
    expect(screen.getByText('产品设计、原型开发、技术实现')).toBeInTheDocument();
  });

  it('点击已完成阶段应调用 onStageClick', () => {
    const onStageClick = vi.fn();
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
        onStageClick={onStageClick}
      />,
    );

    // 点击已完成的概念阶段
    fireEvent.click(screen.getByText('概念'));
    expect(onStageClick).toHaveBeenCalledWith('concept');
  });

  it('点击当前阶段不应调用 onStageClick', () => {
    const onStageClick = vi.fn();
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
        onStageClick={onStageClick}
      />,
    );

    fireEvent.click(screen.getByText('开发'));
    expect(onStageClick).not.toHaveBeenCalled();
  });

  it('pending 阶段的按钮应禁用', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    const buttons = screen.getAllByRole('button');
    // 验证阶段（第4个按钮，index 3）是 pending
    const verifyButton = buttons[3];
    expect(verifyButton).toBeDisabled();
  });

  it('无 onStageClick 时所有按钮都应禁用', () => {
    render(
      <StageTimeline
        stages={createAllStages()}
        currentStage="develop"
      />,
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });
});