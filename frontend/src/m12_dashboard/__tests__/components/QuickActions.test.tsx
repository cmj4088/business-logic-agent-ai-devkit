/** M12 QuickActions.test.tsx — 快速入口组件测试 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuickActions } from '../../components/QuickActions';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderQuickActions() {
  return render(
    <BrowserRouter>
      <QuickActions />
    </BrowserRouter>,
  );
}

describe('QuickActions', () => {
  it('应渲染标题', () => {
    renderQuickActions();
    expect(screen.getByText('快速入口')).toBeInTheDocument();
  });

  it('应渲染"创建新项目"按钮', () => {
    renderQuickActions();
    expect(screen.getByText('创建新项目')).toBeInTheDocument();
    expect(screen.getByText('快速启动 IPD 开发流程')).toBeInTheDocument();
  });

  it('应渲染"审核仪表盘"按钮', () => {
    renderQuickActions();
    expect(screen.getByText('审核仪表盘')).toBeInTheDocument();
    expect(screen.getByText('查看所有待审核事项')).toBeInTheDocument();
  });

  it('点击"创建新项目"应导航到 /projects/new', () => {
    renderQuickActions();
    fireEvent.click(screen.getByText('创建新项目'));
    expect(mockNavigate).toHaveBeenCalledWith('/projects/new');
  });

  it('点击"审核仪表盘"应导航到 /review', () => {
    renderQuickActions();
    fireEvent.click(screen.getByText('审核仪表盘'));
    expect(mockNavigate).toHaveBeenCalledWith('/reviews');
  });
});