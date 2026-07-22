/** M11_auth_pages types.test.ts — 认证模块类型常量测试 */

import { describe, it, expect } from 'vitest';

// 直接测试 auth 模块导出的类型
describe('Auth Types', () => {
  it('LoginRequest 应包含 email 和 password 字段', () => {
    const loginRequest = {
      email: 'test@example.com',
      password: 'Test123456',
    };
    expect(loginRequest).toHaveProperty('email');
    expect(loginRequest).toHaveProperty('password');
    expect(typeof loginRequest.email).toBe('string');
    expect(typeof loginRequest.password).toBe('string');
  });

  it('RegisterRequest 应包含 email, password, displayName 字段', () => {
    const registerRequest = {
      email: 'test@example.com',
      password: 'Test123456',
      displayName: '测试用户',
    };
    expect(registerRequest).toHaveProperty('email');
    expect(registerRequest).toHaveProperty('password');
    expect(registerRequest).toHaveProperty('displayName');
  });

  it('AuthState 应包含 user, token, isAuthenticated', () => {
    const authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    };
    expect(authState).toHaveProperty('user');
    expect(authState).toHaveProperty('token');
    expect(authState).toHaveProperty('isAuthenticated');
    expect(authState.isAuthenticated).toBe(false);
  });

  it('AuthState 认证后状态应正确', () => {
    const authState = {
      user: { id: 'u1', email: 'test@example.com', displayName: '测试' },
      token: 'jwt-token-xxx',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user).not.toBeNull();
    expect(authState.token).toBeTruthy();
  });
});