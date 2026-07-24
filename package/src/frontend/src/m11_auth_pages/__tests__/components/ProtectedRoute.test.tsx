/** M11 ProtectedRoute.test.tsx — 路由守卫组件测试 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';

/** 可变的认证状态 */
let mockIsAuthenticated = false;
let mockIsLoading = false;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    user: mockIsAuthenticated ? { id: '1', name: 'Test' } : null,
  }),
}));

/** 渲染 ProtectedRoute */
function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard 内容</div>} />
        </Route>
        <Route path="/login" element={<div>登录页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    mockIsLoading = false;
  });

  it('加载中应显示加载动画', () => {
    mockIsLoading = true;
    renderProtectedRoute();

    // 加载动画应包含一个旋转的 div
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('未认证应重定向到登录页', () => {
    mockIsAuthenticated = false;
    mockIsLoading = false;
    renderProtectedRoute();

    // 应显示登录页内容
    expect(screen.getByText('登录页')).toBeInTheDocument();
    // 不应显示 Dashboard 内容
    expect(screen.queryByText('Dashboard 内容')).not.toBeInTheDocument();
  });

  it('已认证应渲染子路由', () => {
    mockIsAuthenticated = true;
    mockIsLoading = false;
    renderProtectedRoute();

    expect(screen.getByText('Dashboard 内容')).toBeInTheDocument();
    expect(screen.queryByText('登录页')).not.toBeInTheDocument();
  });

  it('加载中不应渲染子路由或重定向', () => {
    mockIsLoading = true;
    renderProtectedRoute();

    expect(screen.queryByText('Dashboard 内容')).not.toBeInTheDocument();
    expect(screen.queryByText('登录页')).not.toBeInTheDocument();
  });
});