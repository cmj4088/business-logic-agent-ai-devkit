/** M11 认证模块 — 类型定义 */

/** 用户信息 */
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar: string;
  created_at: string;
}

/** 登录表单数据 */
export interface LoginFormData {
  email: string;
  password: string;
}

/** 注册表单数据 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  display_name: string;
}

/** JWT Token 对 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** 认证状态 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** 认证 API 响应包装（扩展共享 ApiResponse） */
export interface AuthApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  error?: { code?: string; message: string };
}