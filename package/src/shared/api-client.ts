/**
 * Business Logic Agent 前端 API 调用封装。
 *
 * 基于 axios 的 HTTP 客户端，提供统一的请求/响应拦截、
 * Token 自动注入、401 未授权处理等功能。
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from './types';

/** 扩展 import.meta 类型以支持 Vite 环境变量 */
interface ImportMetaEnv {
  VITE_API_BASE_URL?: string;
}

/** API 基础 URL，优先使用环境变量，默认兜底为 localhost:8000 */
const API_BASE_URL: string =
  (import.meta as unknown as { env: ImportMetaEnv }).env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * API 客户端类。
 *
 * 封装了 axios 实例，提供统一的 HTTP 方法（GET/POST/PUT/DELETE），
 * 自动注入 Authorization Token 并处理 401 未授权事件。
 */
class ApiClient {
  private instance: AxiosInstance;
  private tokenGetter: (() => Promise<string | null>) | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器：自动注入 Token
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (this.tokenGetter) {
          const token = await this.tokenGetter();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    // 响应拦截器：处理 401 未授权
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token 过期，触发刷新或登出
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * 设置 Token 获取函数。
   *
   * 每次请求前会调用此函数获取最新的 Token。
   *
   * @param getter - 返回 Token 字符串的异步函数，返回 null 表示无 Token。
   */
  setTokenGetter(getter: () => Promise<string | null>): void {
    this.tokenGetter = getter;
  }

  /**
   * 发起 GET 请求。
   *
   * @param url - 请求路径。
   * @param params - 可选的查询参数。
   * @returns 包装在 ApiResponse 中的响应数据。
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  /**
   * 发起 POST 请求。
   *
   * @param url - 请求路径。
   * @param data - 可选的请求体数据。
   * @returns 包装在 ApiResponse 中的响应数据。
   */
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * 发起 PUT 请求。
   *
   * @param url - 请求路径。
   * @param data - 可选的请求体数据。
   * @returns 包装在 ApiResponse 中的响应数据。
   */
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * 发起 DELETE 请求。
   *
   * @param url - 请求路径。
   * @returns 包装在 ApiResponse 中的响应数据。
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * 获取底层 axios 实例。
   *
   * 用于需要直接访问 axios 实例的高级场景。
   *
   * @returns 内部的 AxiosInstance 实例。
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

/** 全局共享的 API 客户端单例 */
export const api = new ApiClient();

export default api;