/** M11 认证模块 — API 调用层
 *
 * 封装后端认证端点，统一返回 AuthApiResponse 格式。
 * 内部使用共享 api-client 的 post/get 函数，捕获异常并转为标准化响应。
 */

import { post as httpPost, get as httpGet, put as httpPut } from '@/shared/api-client';
import type { AuthApiResponse, TokenPair, User } from './types';

/** 将共享 api-client 抛出的异常转为 AuthApiResponse */
async function wrapRequest<T>(fn: () => Promise<T>): Promise<AuthApiResponse<T>> {
  try {
    const data = await fn();
    return { data, message: '', success: true };
  } catch (error: unknown) {
    // 优先从后端业务错误中提取消息
    const err = error as { code?: string; message?: string; response?: { data?: { error?: { code?: string; message?: string } } } };
    const message = err?.message
      || err?.response?.data?.error?.message
      || '请求失败，请稍后重试';
    return { data: null as unknown as T, message, success: false, error: { message } };
  }
}

/** 登录 */
export async function loginAPI(email: string, password: string): Promise<AuthApiResponse<TokenPair>> {
  return wrapRequest(() => httpPost<TokenPair>('/api/auth/login', { email, password }));
}

/** 注册 */
export async function registerAPI(email: string, password: string, displayName: string): Promise<AuthApiResponse<TokenPair>> {
  return wrapRequest(() => httpPost<TokenPair>('/api/auth/register', { email, password, display_name: displayName }));
}

/** 刷新 Token */
export async function refreshTokenAPI(refreshToken: string): Promise<AuthApiResponse<TokenPair>> {
  return wrapRequest(() => httpPost<TokenPair>('/api/auth/refresh', { refresh_token: refreshToken }));
}

/** 获取当前用户信息 */
export async function getMeAPI(): Promise<AuthApiResponse<User>> {
  return wrapRequest(() => httpGet<User>('/api/auth/me'));
}

/** 登出 */
export async function logoutAPI(): Promise<AuthApiResponse<Record<string, unknown>>> {
  return wrapRequest(() => httpPost<Record<string, unknown>>('/api/auth/logout'));
}

/** 更新用户资料 */
export async function updateProfileAPI(data: { display_name?: string; avatar?: string }): Promise<AuthApiResponse<User>> {
  return wrapRequest(() => httpPut<User>('/api/auth/profile', data));
}

/** 修改密码 */
export async function changePasswordAPI(data: { old_password: string; new_password: string }): Promise<AuthApiResponse<{ message: string }>> {
  return wrapRequest(() => httpPut<{ message: string }>('/api/auth/change-password', data));
}