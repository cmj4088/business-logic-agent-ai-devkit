/** M14a ProjectHeader.test.tsx — 项目头部组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectHeader from '../../components/ProjectHeader';
import type { ProjectDetail } from '../../types';

/** 创建测试项目 */
function createProject(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 'proj_001',
    name: '智能音箱 X1',
    description: 'AI 智能音箱产品开发',
    complexity: 'standard',
    currentStage: 'develop',
    status: 'active',
    progress: 45,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-09T10:00:00Z',
    industry: '消费电子',
    targetWeeks: 12,
    teamSize: 10,
    budgetLimit: 500000,
    ...overrides,
  };
}

describe('ProjectHeader', () => {
  it('应渲染项目名称', () => {
    render(<ProjectHeader project={createProject()} />);
    expect(screen.getByText('智能音箱 X1')).toBeInTheDocument();
  });

  it('应渲染复杂度模式', () => {
    render(<ProjectHeader project={createProject({ complexity: 'standard' })} />);
    expect(screen.getByText('标准模式')).toBeInTheDocument();
  });

  it('lite 复杂度应显示轻量模式', () => {
    render(<ProjectHeader project={createProject({ complexity: 'lite' })} />);
    expect(screen.getByText('轻量模式')).toBeInTheDocument();
  });

  it('full 复杂度应显示完整模式', () => {
    render(<ProjectHeader project={createProject({ complexity: 'full' })} />);
    expect(screen.getByText('完整模式')).toBeInTheDocument();
  });

  it('应渲染项目状态标签', () => {
    render(<ProjectHeader project={createProject({ status: 'active' })} />);
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('暂停状态应显示已暂停', () => {
    render(<ProjectHeader project={createProject({ status: 'paused' })} />);
    expect(screen.getByText('已暂停')).toBeInTheDocument();
  });

  it('应渲染当前阶段', () => {
    render(<ProjectHeader project={createProject({ currentStage: 'develop' })} />);
    expect(screen.getByText('开发阶段')).toBeInTheDocument();
  });

  it('应渲染进度百分比', () => {
    render(<ProjectHeader project={createProject({ progress: 75 })} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('应渲染进度条', () => {
    render(<ProjectHeader project={createProject({ progress: 50 })} />);
    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('应渲染操作按钮', () => {
    render(<ProjectHeader project={createProject()} />);
    expect(screen.getByText('暂停')).toBeInTheDocument();
    expect(screen.getByText('推进到下一阶段')).toBeInTheDocument();
  });

  it('进度为 0 时应显示 0%', () => {
    render(<ProjectHeader project={createProject({ progress: 0 })} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('进度超过 100 时应限制为 100%', () => {
    render(<ProjectHeader project={createProject({ progress: 150 })} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});