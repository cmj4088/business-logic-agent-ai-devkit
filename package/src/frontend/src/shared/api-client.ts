/** Business Logic Agent API 客户端
 *
 * 基于 axios 的 HTTP 客户端，处理请求/响应拦截、错误处理等。
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { API_BASE_URL } from './constants';
import type { ApiResponse } from './types';

/** 创建 axios 实例 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** 请求拦截器 */
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token 并添加到请求头
    const token = localStorage.getItem('ipd_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/** 响应拦截器 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    // 检查后端返回的业务错误（HTTP 200 但 error 字段非空）
    const body = response.data;
    if (body && body.error) {
      const err = new Error(body.error.message || '请求失败') as Error & { code: string; response: AxiosResponse };
      err.code = body.error.code || 'UNKNOWN_ERROR';
      err.response = response;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权，由 AuthContext 统一处理，此处仅 debug 日志
          console.debug('[API] 未授权访问');
          break;
        case 403:
          console.error('[API] 禁止访问');
          break;
        case 404:
          console.error('[API] 资源未找到');
          break;
        case 500:
          console.error('[API] 服务器内部错误');
          break;
        default:
          console.error(`[API] HTTP ${status}:`, data);
      }
    } else if (error.request) {
      console.error('[API] 网络错误，无法连接到服务器');
    } else {
      console.error('[API] 请求配置错误:', error.message);
    }

    return Promise.reject(error);
  },
);

/** 通用 GET 请求 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data.data;
}

/** 通用 POST 请求 */
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/** 通用 PUT 请求 */
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/** 通用 DELETE 请求 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data.data;
}

export default apiClient;