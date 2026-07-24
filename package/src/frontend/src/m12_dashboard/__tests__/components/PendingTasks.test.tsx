/** M12 PendingTasks.test.tsx — 待处理事项组件测试 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingTasks } from '../../components/PendingTasks';
import type { PendingTask } from '../../types';

/** 创建测试任务 */
function createTask(overrides: Partial<PendingTask> = {}): PendingTask {
  return {
    id: 'task_001',
    title: '审核 PRD 文档',
    description: '需要审核产品需求文档',
    priority: 'high',
    type: 'review',
    projectId: 'proj_001',
    projectName: '智能音箱 X1',
    createdAt: '2026-07-09T09:00:00Z',
    waitingSince: '已等1小时',
    ...overrides,
  };
}

describe('PendingTasks', () => {
  it('空列表应返回 null', () => {
    const { container } = render(<PendingTasks tasks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('应渲染标题', () => {
    render(<PendingTasks tasks={[createTask()]} />);

    expect(screen.getByText('需要你处理')).toBeInTheDocument();
  });

  it('应渲染任务标题和描述', () => {
    render(<PendingTasks tasks={[createTask()]} />);

    expect(screen.getByText('审核 PRD 文档')).toBeInTheDocument();
    expect(screen.getByText(/智能音箱 X1/)).toBeInTheDocument();
    expect(screen.getByText(/需要审核产品需求文档/)).toBeInTheDocument();
  });

  it('应渲染等待时间', () => {
    render(<PendingTasks tasks={[createTask({ waitingSince: '已等2小时' })]} />);

    expect(screen.getByText('已等2小时')).toBeInTheDocument();
  });

  it('应显示任务类型标签', () => {
    render(<PendingTasks tasks={[createTask({ type: 'review' })]} />);
    expect(screen.getByText('审核')).toBeInTheDocument();
  });

  it('应显示投票类型标签', () => {
    render(<PendingTasks tasks={[createTask({ type: 'vote' })]} />);
    expect(screen.getByText('投票')).toBeInTheDocument();
  });

  it('应显示门禁类型标签', () => {
    render(<PendingTasks tasks={[createTask({ type: 'gate' })]} />);
    expect(screen.getByText('门禁')).toBeInTheDocument();
  });

  it('应显示高优先级样式', () => {
    render(<PendingTasks tasks={[createTask({ priority: 'high' })]} />);

    // 高优先级应有红色圆点
    const dot = document.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
  });

  it('应显示中优先级样式', () => {
    render(<PendingTasks tasks={[createTask({ priority: 'medium' })]} />);

    const dot = document.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
  });

  it('应显示低优先级样式', () => {
    render(<PendingTasks tasks={[createTask({ priority: 'low' })]} />);

    const dot = document.querySelector('.bg-gray-400');
    expect(dot).toBeInTheDocument();
  });

  it('应按优先级排序（高 > 中 > 低）', () => {
    const tasks = [
      createTask({ id: '1', priority: 'low', title: '低优先级任务' }),
      createTask({ id: '2', priority: 'high', title: '高优先级任务' }),
      createTask({ id: '3', priority: 'medium', title: '中优先级任务' }),
    ];
    render(<PendingTasks tasks={tasks} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('高优先级任务');
    expect(items[1].textContent).toContain('中优先级任务');
    expect(items[2].textContent).toContain('低优先级任务');
  });

  it('应渲染多个任务', () => {
    const tasks = [
      createTask({ id: '1', title: '任务A', priority: 'high' }),
      createTask({ id: '2', title: '任务B', priority: 'medium' }),
    ];
    render(<PendingTasks tasks={tasks} />);

    expect(screen.getByText('任务A')).toBeInTheDocument();
    expect(screen.getByText('任务B')).toBeInTheDocument();
  });
});