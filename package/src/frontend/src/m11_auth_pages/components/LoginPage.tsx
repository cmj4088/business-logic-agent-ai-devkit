/** M11 认证模块 — 登录页面 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-base px-4">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Business Logic Agent</h1>
          <p className="text-slate-400 mt-2">登录您的账号</p>
        </div>

        {/* 登录卡片 */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 邮箱 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1.5">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-deep-border rounded-lg text-sm bg-deep-surface text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent
                           placeholder:text-slate-500 transition-colors"
              />
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1.5">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-deep-border rounded-lg text-sm bg-deep-surface text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent
                           placeholder:text-slate-500 transition-colors"
              />
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 neon-btn-blue disabled:opacity-50
                         text-white font-medium rounded-lg text-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base"
            >
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 注册链接 */}
          <p className="mt-6 text-center text-sm text-slate-500">
            没有账号？{' '}
            <Link to="/register" className="text-neon-blue hover:text-neon-blue/80 font-medium">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}