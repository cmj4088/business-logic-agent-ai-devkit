/** M12 WelcomeBanner.test.tsx — 欢迎横幅组件测试 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeBanner } from '../../components/WelcomeBanner';
import type { DashboardUser } from '../../types';

/** 创建测试用户 */
function createUser(overrides: Partial<DashboardUser> = {}): DashboardUser {
  return {
    name: '张三',
    ...overrides,
  };
}

describe('WelcomeBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 使用本地时间：2026-07-09 10:00（上午）
    vi.setSystemTime(new Date(2026, 6, 9, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应渲染用户名称和问候语', () => {
    const user = createUser();
    render(<WelcomeBanner user={user} />);

    expect(screen.getByText(/早上好/)).toBeInTheDocument();
    expect(screen.getByText(/张三/)).toBeInTheDocument();
  });

  it('应渲染当前日期', () => {
    const user = createUser();
    render(<WelcomeBanner user={user} />);

    // 2026年7月9日是星期四
    expect(screen.getByText('2026年7月9日 星期四')).toBeInTheDocument();
  });

  it('下午应显示"下午好"', () => {
    vi.setSystemTime(new Date(2026, 6, 9, 14, 0, 0));
    const user = createUser();
    render(<WelcomeBanner user={user} />);

    expect(screen.getByText(/下午好/)).toBeInTheDocument();
  });

  it('晚上应显示"晚上好"', () => {
    vi.setSystemTime(new Date(2026, 6, 9, 20, 0, 0));
    const user = createUser();
    render(<WelcomeBanner user={user} />);

    expect(screen.getByText(/晚上好/)).toBeInTheDocument();
  });

  it('有角色时应显示角色', () => {
    const user = createUser({ role: '管理员' });
    render(<WelcomeBanner user={user} />);

    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('无角色时不应显示角色信息', () => {
    const user = createUser({ role: undefined });
    render(<WelcomeBanner user={user} />);

    // 不应有 role 元素
    const roleEl = screen.queryByText('管理员');
    expect(roleEl).not.toBeInTheDocument();
  });

  it('有头像时应显示头像图片', () => {
    const user = createUser({ avatar: 'https://example.com/avatar.png' });
    render(<WelcomeBanner user={user} />);

    const img = screen.getByAltText('张三');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('无头像时应显示首字母代替', () => {
    const user = createUser({ name: '李四', avatar: undefined });
    render(<WelcomeBanner user={user} />);

    // 应显示首字母
    expect(screen.getByText('李')).toBeInTheDocument();
    // 不应有 img 元素
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});