/** M12 AutoCompletedTasks.test.tsx — 自动完成事项组件测试 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoCompletedTasks } from '../../components/AutoCompletedTasks';
import type { AutoCompletedTask } from '../../types';

/** 创建测试任务 */
function createTask(overrides: Partial<AutoCompletedTask> = {}): AutoCompletedTask {
  return {
    id: 'task_001',
    title: '创建 MRD 文档',
    description: 'AI 自动生成了市场需求文档',
    projectId: 'proj_001',
    projectName: '智能音箱 X1',
    completedAt: '2026-07-09T09:30:00Z',
    ...overrides,
  };
}

describe('AutoCompletedTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 使用 UTC 时间避免时区问题
    vi.setSystemTime(new Date(Date.UTC(2026, 6, 9, 10, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('空列表应返回 null', () => {
    const { container } = render(<AutoCompletedTasks tasks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('应渲染任务列表标题', () => {
    const tasks = [createTask()];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('自动完成')).toBeInTheDocument();
  });

  it('应渲染任务描述', () => {
    const tasks = [createTask()];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText(/智能音箱 X1/)).toBeInTheDocument();
    expect(screen.getByText(/AI 自动生成了市场需求文档/)).toBeInTheDocument();
  });

  it('应显示相对时间"刚刚"', () => {
    const tasks = [createTask({ completedAt: '2026-07-09T09:59:30Z' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('应显示相对时间"X分钟前"', () => {
    const tasks = [createTask({ completedAt: '2026-07-09T09:40:00Z' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('20分钟前')).toBeInTheDocument();
  });

  it('应显示相对时间"X小时前"', () => {
    const tasks = [createTask({ completedAt: '2026-07-09T07:00:00Z' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('3小时前')).toBeInTheDocument();
  });

  it('应显示相对时间"X天前"', () => {
    const tasks = [createTask({ completedAt: '2026-07-07T10:00:00Z' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('2天前')).toBeInTheDocument();
  });

  it('应显示具体日期（超过7天）', () => {
    const tasks = [createTask({ completedAt: '2026-06-15T10:00:00Z' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('6月15日')).toBeInTheDocument();
  });

  it('无效日期应直接显示原始字符串', () => {
    const tasks = [createTask({ completedAt: 'invalid-date' })];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });

  it('应渲染多个任务', () => {
    const tasks = [
      createTask({ id: '1', projectName: '项目A', description: '任务A' }),
      createTask({ id: '2', projectName: '项目B', description: '任务B' }),
    ];
    render(<AutoCompletedTasks tasks={tasks} />);

    expect(screen.getByText(/项目A/)).toBeInTheDocument();
    expect(screen.getByText(/项目B/)).toBeInTheDocument();
  });
});