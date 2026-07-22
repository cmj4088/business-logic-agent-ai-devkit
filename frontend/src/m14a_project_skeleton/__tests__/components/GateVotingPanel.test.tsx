/** M14b GateVotingPanel.test.tsx — 门禁投票面板组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GateVotingPanel from '../../components/GateVotingPanel';
import type { GateStatusData, GateVoteResult } from '../../types';

/** 创建测试用的门禁数据 */
function createGate(overrides: Partial<GateStatusData> = {}): GateStatusData {
  return {
    name: 'gate_concept',
    label: '概念阶段门禁',
    stage: 'concept',
    status: 'pending',
    description: '检查概念阶段的所有产出物是否完整',
    ...overrides,
  };
}

/** 创建测试用的投票结果 */
function createVoteResult(overrides: Partial<GateVoteResult> = {}): GateVoteResult {
  return {
    gateId: 'gate_concept',
    status: 'passed',
    votes: [{ voter: 'product_manager', vote: 'approve', comment: '审核通过' }],
    autoApproved: false,
    ...overrides,
  };
}

describe('GateVotingPanel', () => {
  it('应渲染门禁名称和描述', () => {
    const gate = createGate();
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={vi.fn()}
      />,
    );

    expect(screen.getByText(gate.label)).toBeInTheDocument();
    expect(screen.getByText(gate.description)).toBeInTheDocument();
  });

  it('pending 状态应显示投票按钮', () => {
    const gate = createGate({ status: 'pending' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={vi.fn()}
      />,
    );

    expect(screen.getByText('通过')).toBeInTheDocument();
    expect(screen.getByText('驳回')).toBeInTheDocument();
    expect(screen.getByText('弃权')).toBeInTheDocument();
  });

  it('点击通过按钮应调用 onVote', () => {
    const onVote = vi.fn();
    const gate = createGate({ status: 'pending' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByText('通过'));
    expect(onVote).toHaveBeenCalledWith(gate.name, 'approve', undefined);
  });

  it('点击驳回按钮应调用 onVote', () => {
    const onVote = vi.fn();
    const gate = createGate({ status: 'pending' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByText('驳回'));
    expect(onVote).toHaveBeenCalledWith(gate.name, 'reject', undefined);
  });

  it('点击弃权按钮应调用 onVote', () => {
    const onVote = vi.fn();
    const gate = createGate({ status: 'pending' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={onVote}
      />,
    );

    fireEvent.click(screen.getByText('弃权'));
    expect(onVote).toHaveBeenCalledWith(gate.name, 'abstain', undefined);
  });

  it('已投票后应显示投票记录', () => {
    const gate = createGate({ status: 'voting' });
    const result = createVoteResult();
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={result}
        isVoting={false}
        onVote={vi.fn()}
      />,
    );

    // 应显示投票记录
    expect(screen.getByText('投票记录：')).toBeInTheDocument();
    expect(screen.getByText('product_manager')).toBeInTheDocument();
  });

  it('自动通过时应显示提示', () => {
    const gate = createGate({ status: 'passed' });
    const result = createVoteResult({ autoApproved: true, votes: [{ voter: 'system', vote: 'approve' }] });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={result}
        isVoting={false}
        onVote={vi.fn()}
      />,
    );

    expect(screen.getByText('⚠️ 自动通过（单人模式）')).toBeInTheDocument();
  });

  it('投票中应禁用所有按钮', () => {
    const gate = createGate({ status: 'pending' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={true}
        onVote={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it('passed 状态的门禁不应显示投票按钮', () => {
    const gate = createGate({ status: 'passed' });
    render(
      <GateVotingPanel
        gate={gate}
        gateResult={null}
        isVoting={false}
        onVote={vi.fn()}
      />,
    );

    expect(screen.queryByText('通过')).not.toBeInTheDocument();
  });
});