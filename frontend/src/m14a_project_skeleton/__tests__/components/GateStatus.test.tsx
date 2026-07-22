/** M14a GateStatus.test.tsx — 门禁状态栏组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GateStatus from '../../components/GateStatus';
import type { GateStatusData } from '../../types';

/** 创建测试门禁 */
function createGate(overrides: Partial<GateStatusData> = {}): GateStatusData {
  return {
    name: 'gate_concept',
    label: '概念门禁',
    stage: 'concept',
    status: 'passed',
    description: '检查概念阶段产出物',
    ...overrides,
  };
}

describe('GateStatus', () => {
  it('空列表应显示无门禁提示', () => {
    render(<GateStatus gates={[]} />);
    expect(screen.getByText('当前阶段无门禁检查')).toBeInTheDocument();
  });

  it('应渲染门禁标题', () => {
    render(<GateStatus gates={[createGate()]} />);
    expect(screen.getByText('门禁状态')).toBeInTheDocument();
  });

  it('应渲染门禁标签', () => {
    render(<GateStatus gates={[createGate({ label: '概念门禁' })]} />);
    expect(screen.getByText('概念门禁')).toBeInTheDocument();
  });

  it('通过状态应显示 ✓ 图标', () => {
    render(<GateStatus gates={[createGate({ status: 'passed' })]} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('失败状态应显示 ✗ 图标', () => {
    render(<GateStatus gates={[createGate({ status: 'failed' })]} />);
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('投票中状态应显示 ◷ 图标', () => {
    render(<GateStatus gates={[createGate({ status: 'voting' })]} />);
    expect(screen.getByText('◷')).toBeInTheDocument();
  });

  it('待处理状态应显示 ◻ 图标', () => {
    render(<GateStatus gates={[createGate({ status: 'pending' })]} />);
    expect(screen.getByText('◻')).toBeInTheDocument();
  });

  it('应渲染多个门禁', () => {
    const gates = [
      createGate({ name: 'g1', label: '门禁A', status: 'passed' }),
      createGate({ name: 'g2', label: '门禁B', status: 'pending' }),
      createGate({ name: 'g3', label: '门禁C', status: 'voting' }),
    ];
    render(<GateStatus gates={gates} />);

    expect(screen.getByText('门禁A')).toBeInTheDocument();
    expect(screen.getByText('门禁B')).toBeInTheDocument();
    expect(screen.getByText('门禁C')).toBeInTheDocument();
  });

  it('门禁应有 title 属性显示描述', () => {
    render(<GateStatus gates={[createGate({ description: '检查概念阶段产出物' })]} />);
    const gateEl = screen.getByText('概念门禁');
    expect(gateEl).toBeInTheDocument();
  });
});