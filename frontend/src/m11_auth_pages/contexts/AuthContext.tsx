/** M11 认证模块 — 认证上下文
 *
 * 提供全局认证状态管理，包括登录、注册、登出、Token 刷新等功能。
 * MVP 阶段 Token 存储在 localStorage，后续迁移到 Electron secureStore。
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import type { AuthState, TokenPair } from '../types';
import { loginAPI, registerAPI, getMeAPI, refreshTokenAPI, updateProfileAPI, changePasswordAPI } from '../api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: { display_name?: string; avatar?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'ipd_access_token';
const REFRESH_KEY = 'ipd_refresh_token';

function saveTokens(tokens: TokenPair): void {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 初始化时检查 Token 并获取用户信息
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      getMeAPI()
        .then((res) => {
          if (res.success && res.data) {
            setState({ user: res.data as User, isAuthenticated: true, isLoading: false });
          } else {
            clearTokens();
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
        })
        .catch(() => {
          clearTokens();
          setState({ user: null, isAuthenticated: false, isLoading: false });
        });
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginAPI(email, password);
    if (res.error) throw new Error(res.error.message);
    if (res.data) {
      saveTokens(res.data);
      const meRes = await getMeAPI();
      setState({ user: meRes.data as User, isAuthenticated: true, isLoading: false });
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await registerAPI(email, password, displayName);
    if (res.error) throw new Error(res.error.message);
    if (res.data) {
      saveTokens(res.data);
      const meRes = await getMeAPI();
      setState({ user: meRes.data as User, isAuthenticated: true, isLoading: false });
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return;
    try {
      const res = await refreshTokenAPI(refreshToken);
      if (res.data) {
        saveTokens(res.data);
      }
    } catch {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const updateProfile = useCallback(async (data: { display_name?: string; avatar?: string }) => {
    const res = await updateProfileAPI(data);
    if (res.error) throw new Error(res.error.message);
    if (res.data) {
      setState((prev) => ({ ...prev, user: res.data as User }));
    }
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const res = await changePasswordAPI({ old_password: oldPassword, new_password: newPassword });
    if (res.error) throw new Error(res.error.message);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshAuth, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
}