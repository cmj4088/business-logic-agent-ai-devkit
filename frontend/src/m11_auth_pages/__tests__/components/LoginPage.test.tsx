/** M11 LoginPage.test.tsx — 登录页面组件测试 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../components/LoginPage';

/** Mock useAuth */
const mockLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

/** Mock useNavigate */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/** 渲染 LoginPage 的辅助函数 */
function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染标题和登录表单', () => {
    renderLoginPage();

    expect(screen.getByText('Business Logic Agent')).toBeInTheDocument();
    expect(screen.getByText('登录您的账号')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('应渲染注册链接', () => {
    renderLoginPage();

    const registerLink = screen.getByText('注册');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('邮箱输入框应更新值', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText('邮箱');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('密码输入框应更新值', () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText('密码');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    expect(passwordInput).toHaveValue('mypassword');
  });

  it('空邮箱提交应显示错误', async () => {
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: '登录' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请填写邮箱和密码')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('空密码提交应显示错误', async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText('邮箱');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: '登录' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请填写邮箱和密码')).toBeInTheDocument();
    });
  });

  it('登录成功应调用 login 并跳转', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('登录失败应显示错误信息', async () => {
    mockLogin.mockRejectedValueOnce(new Error('邮箱或密码错误'));
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });
  });

  it('登录失败异常对象非 Error 时显示默认错误', async () => {
    mockLogin.mockRejectedValueOnce('未知错误');
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'pass' } });

    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByText('登录失败，请稍后重试')).toBeInTheDocument();
    });
  });

  it('登录提交中应显示"登录中..."并禁用按钮', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // 永不 resolve
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled();
    });
  });
});