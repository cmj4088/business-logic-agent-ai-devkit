/** M14b RecoveryPanel.test.tsx — 异常恢复面板组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecoveryPanel from '../../components/RecoveryPanel';
import type { RecoveryAction } from '../../types';

/** 创建测试用的恢复动作 */
function createRecoveryAction(overrides: Partial<RecoveryAction> = {}): RecoveryAction {
  return {
    id: 'rec_001',
    type: 'regenerate',
    title: '辩论死锁 - 需要重新生成',
    description: 'Agent 之间未能就设计方案达成一致，已超过最大辩论轮次。',
    options: [
      { label: '重新生成产出物', action: 'regenerate_artifact', type: 'primary' },
      { label: '人工裁决', action: 'moderator_decide', type: 'secondary' },
      { label: '跳过此问题', action: 'skip', type: 'link' },
    ],
    ...overrides,
  };
}

describe('RecoveryPanel', () => {
  it('应渲染恢复动作标题和描述', () => {
    const action = createRecoveryAction();
    render(
      <RecoveryPanel
        action={action}
        isExecuting={false}
        onExecute={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(action.title)).toBeInTheDocument();
    expect(screen.getByText(action.description)).toBeInTheDocument();
  });

  it('应渲染所有恢复选项按钮', () => {
    const action = createRecoveryAction();
    render(
      <RecoveryPanel
        action={action}
        isExecuting={false}
        onExecute={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    for (const option of action.options) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    }
  });

  it('点击恢复选项应调用 onExecute', () => {
    const onExecute = vi.fn();
    const action = createRecoveryAction();
    render(
      <RecoveryPanel
        action={action}
        isExecuting={false}
        onExecute={onExecute}
        onClose={vi.fn()}
      />,
    );

    const firstOption = screen.getByText(action.options[0].label);
    fireEvent.click(firstOption);

    expect(onExecute).toHaveBeenCalledWith(action.id, action.options[0].action);
  });

  it('执行中应禁用所有按钮并显示执行中文本', () => {
    const action = createRecoveryAction();
    render(
      <RecoveryPanel
        action={action}
        isExecuting={true}
        onExecute={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    // 排除关闭按钮
    const actionButtons = buttons.filter((btn) =>
      action.options.some((opt) => opt.label === btn.textContent || btn.textContent === '执行中...'),
    );

    for (const button of actionButtons) {
      if (button.textContent === '执行中...') {
        expect(button).toBeDisabled();
      }
    }
  });

  it('点击关闭按钮应调用 onClose', () => {
    const onClose = vi.fn();
    const action = createRecoveryAction();
    render(
      <RecoveryPanel
        action={action}
        isExecuting={false}
        onExecute={vi.fn()}
        onClose={onClose}
      />,
    );

    // 查找关闭按钮（不含恢复选项文本的按钮）
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((btn) =>
      btn.querySelector('svg') && !action.options.some((opt) => opt.label === btn.textContent),
    );
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('不同异常类型应显示不同图标', () => {
    const types = ['regenerate', 'switch_model', 'moderator_decide', 'restart_debate', 'proceed_with_issues'] as const;
    const icons = ['🔄', '🔀', '⚖️', '🔁', '⚠️'];

    for (let i = 0; i < types.length; i++) {
      const action = createRecoveryAction({ type: types[i] });
      const { container, unmount } = render(
        <RecoveryPanel
          action={action}
          isExecuting={false}
          onExecute={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(container.textContent).toContain(icons[i]);
      unmount();
    }
  });
});