/** M11 认证模块 — 注册页面 */

import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PrivacyPolicyModal } from '@/shared/components/PrivacyPolicyModal';
import { TermsOfServiceModal } from '@/shared/components/TermsOfServiceModal';

/** 密码强度等级 */
type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

/** 计算密码强度 */
function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'empty';
  const hasMinLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasMinLength && hasDigit && hasLetter && hasSpecial) return 'strong';
  if (hasMinLength && hasDigit && hasLetter) return 'medium';
  return 'weak';
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  empty: { label: '', color: 'bg-slate-200', width: 'w-0' },
  weak: { label: '弱', color: 'bg-red-500', width: 'w-1/4' },
  medium: { label: '中等', color: 'bg-yellow-500', width: 'w-2/4' },
  strong: { label: '强', color: 'bg-green-500', width: 'w-full' },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthInfo = strengthConfig[strength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少为 8 位');
      return;
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setError('密码必须包含数字和字母');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!agreedPrivacy || !agreedTerms) {
      setError('请阅读并同意隐私政策和用户协议');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email.trim(), password, displayName.trim());
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-base px-4 py-8">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Business Logic Agent</h1>
          <p className="text-slate-400 mt-2">创建新账号</p>
        </div>

        {/* 注册卡片 */}
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

            {/* 显示名称 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-200 mb-1.5">
                显示名称 <span className="text-slate-500 font-normal">（可选）</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="请输入您的名称"
                autoComplete="name"
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
                placeholder="至少 8 位，包含数字和字母"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-deep-border rounded-lg text-sm bg-deep-surface text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent
                           placeholder:text-slate-500 transition-colors"
              />
              {/* 密码强度指示器 */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-deep-card rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color} ${strengthInfo.width}`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    密码强度：{strengthInfo.label}
                    {strength === 'weak' && '（需要至少 8 位，包含数字和字母）'}
                  </p>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 mb-1.5">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-deep-border rounded-lg text-sm bg-deep-surface text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent
                           placeholder:text-slate-500 transition-colors"
              />
            </div>

            {/* 隐私政策与用户协议 */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-deep-border bg-deep-surface text-neon-blue focus:ring-neon-blue"
                />
                <span className="text-slate-300">
                  我已阅读并同意{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-neon-blue underline hover:text-neon-blue/80"
                  >
                    隐私政策
                  </button>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-deep-border bg-deep-surface text-neon-blue focus:ring-neon-blue"
                />
                <span className="text-slate-300">
                  我已阅读并同意{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-neon-blue underline hover:text-neon-blue/80"
                  >
                    用户协议
                  </button>
                </span>
              </label>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 neon-btn-blue disabled:opacity-50
                         text-white font-medium rounded-lg text-sm transition-colors
                         focus:outline-none focus:ring-2 focus:ring-neon-blue focus:ring-offset-2 focus:ring-offset-deep-base"
            >
              {isSubmitting ? '注册中...' : '注册'}
            </button>
          </form>

          {/* 登录链接 */}
          <p className="mt-6 text-center text-sm text-slate-500">
            已有账号？{' '}
            <Link to="/login" className="text-neon-blue hover:text-neon-blue/80 font-medium">
              登录
            </Link>
          </p>
        </div>
      </div>
    {/* 隐私政策弹窗 */}
      <PrivacyPolicyModal
        isOpen={showPrivacy}
        onAgree={() => {
          setAgreedPrivacy(true);
          setShowPrivacy(false);
        }}
        onDisagree={() => setShowPrivacy(false)}
      />

      {/* 用户协议弹窗 */}
      <TermsOfServiceModal
        isOpen={showTerms}
        onAgree={() => {
          setAgreedTerms(true);
          setShowTerms(false);
        }}
        onDisagree={() => setShowTerms(false)}
      />
    </div>
  );
}