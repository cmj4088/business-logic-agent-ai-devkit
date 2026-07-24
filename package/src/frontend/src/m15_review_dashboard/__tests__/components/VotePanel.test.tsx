/** M15 VotePanel.test.tsx — 投票面板组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VotePanel } from '../../components/VotePanel';

describe('VotePanel', () => {
  it('应渲染投票标题', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('审核投票')).toBeInTheDocument();
  });

  it('应渲染三个投票按钮', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('通过')).toBeInTheDocument();
    expect(screen.getByText('驳回')).toBeInTheDocument();
    expect(screen.getByText('需要修改')).toBeInTheDocument();
  });

  it('应渲染"提交投票"按钮', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('提交投票')).toBeInTheDocument();
  });

  it('应渲染"审核升级"按钮', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('审核升级')).toBeInTheDocument();
  });

  it('未选择投票时"提交投票"应禁用', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    const submitBtn = screen.getByText('提交投票');
    expect(submitBtn).toBeDisabled();
  });

  it('选择"通过"应启用提交按钮', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('通过'));
    const submitBtn = screen.getByText('提交投票');
    expect(submitBtn).not.toBeDisabled();
  });

  it('选择"驳回"应显示理由输入框', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('驳回'));
    expect(screen.getByLabelText(/驳回理由/)).toBeInTheDocument();
  });

  it('选择"需要修改"应显示理由输入框', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('需要修改'));
    expect(screen.getByLabelText(/修改要求/)).toBeInTheDocument();
  });

  it('驳回未填写理由时提交按钮应禁用', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('驳回'));
    const submitBtn = screen.getByText('提交投票');
    expect(submitBtn).toBeDisabled();
  });

  it('驳回填完理由后提交按钮应启用', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('驳回'));
    fireEvent.change(screen.getByLabelText(/驳回理由/), {
      target: { value: '内容不完整，缺少关键数据' },
    });

    const submitBtn = screen.getByText('提交投票');
    expect(submitBtn).not.toBeDisabled();
  });

  it('点击"提交投票"应弹出确认弹窗', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('通过'));
    fireEvent.click(screen.getByText('提交投票'));

    expect(screen.getByText('确认操作')).toBeInTheDocument();
    expect(screen.getByText('确认通过此审核？')).toBeInTheDocument();
  });

  it('确认弹窗中点击"确认"应调用 onSubmitVote', () => {
    const onSubmitVote = vi.fn();
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={onSubmitVote}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('通过'));
    fireEvent.click(screen.getByText('提交投票'));
    fireEvent.click(screen.getByText('确认'));

    expect(onSubmitVote).toHaveBeenCalledWith('approve', '');
  });

  it('驳回确认弹窗中点击"确认"应调用 onSubmitVote 带理由', () => {
    const onSubmitVote = vi.fn();
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={onSubmitVote}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('驳回'));
    fireEvent.change(screen.getByLabelText(/驳回理由/), {
      target: { value: '数据不完整' },
    });
    fireEvent.click(screen.getByText('提交投票'));
    fireEvent.click(screen.getByText('确认'));

    expect(onSubmitVote).toHaveBeenCalledWith('reject', '数据不完整');
  });

  it('确认弹窗中点击"取消"应关闭弹窗', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('通过'));
    fireEvent.click(screen.getByText('提交投票'));
    fireEvent.click(screen.getByText('取消'));

    expect(screen.queryByText('确认操作')).not.toBeInTheDocument();
  });

  it('应显示投票错误', () => {
    render(
      <VotePanel
        voting={false}
        voteError="投票失败，请稍后重试"
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('投票失败，请稍后重试')).toBeInTheDocument();
  });

  it('投票中应禁用所有按钮', () => {
    render(
      <VotePanel
        voting={true}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it('投票中应显示"提交中..."', () => {
    render(
      <VotePanel
        voting={true}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
      />,
    );

    expect(screen.getByText('提交中...')).toBeInTheDocument();
  });

  it('点击"审核升级"应调用 onEscalate', () => {
    const onEscalate = vi.fn();
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={onEscalate}
      />,
    );

    fireEvent.click(screen.getByText('审核升级'));
    expect(onEscalate).toHaveBeenCalled();
  });

  it('disabled=true 时应禁用所有按钮', () => {
    render(
      <VotePanel
        voting={false}
        voteError={null}
        onSubmitVote={vi.fn()}
        onEscalate={vi.fn()}
        disabled={true}
      />,
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });
});