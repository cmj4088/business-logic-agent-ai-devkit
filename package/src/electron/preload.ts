/**
 * Preload 脚本
 *
 * 在主进程和渲染进程之间建立安全桥梁。
 * 使用 contextBridge 暴露有限的、安全的 API 给渲染进程。
 *
 * 安全规则：
 * - 只能使用 ipcRenderer.invoke（请求-响应模式）
 * - 禁止使用 ipcRenderer.send/on（推送模式，权限过大）
 * - 禁止暴露 Node.js API（如 fs、path、child_process）
 * - 禁止暴露 ipcRenderer 本身
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * 暴露给渲染进程的安全 API
 *
 * 渲染进程通过 window.electronAPI 访问这些方法。
 * 所有方法都是异步的（基于 ipcRenderer.invoke）。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== 安全存储 =====

  /**
   * 读取安全存储中的值
   * @param key - 存储键名
   * @returns 存储的值，不存在则返回 undefined
   */
  getSecure: (key: string): Promise<string | undefined> => {
    return ipcRenderer.invoke('store:get', key);
  },

  /**
   * 写入安全存储
   * @param key - 存储键名
   * @param value - 要存储的值（敏感字段自动加密）
   */
  setSecure: (key: string, value: string): Promise<boolean> => {
    return ipcRenderer.invoke('store:set', key, value);
  },

  /**
   * 删除安全存储中的值
   * @param key - 存储键名
   */
  deleteSecure: (key: string): Promise<boolean> => {
    return ipcRenderer.invoke('store:delete', key);
  },

  // ===== 系统通知 =====

  /**
   * 显示系统通知
   * @param title - 通知标题
   * @param body - 通知正文
   */
  showNotification: (title: string, body: string): Promise<boolean> => {
    return ipcRenderer.invoke('notification:show', title, body);
  },

  // ===== 文件对话框 =====

  /**
   * 打开文件选择对话框
   * @param options - 对话框选项
   * @param options.filters - 文件类型过滤器
   */
  openFileDialog: (options: {
    filters: { name: string; extensions: string[] }[];
  }): Promise<{ canceled: boolean; filePaths: string[] }> => {
    return ipcRenderer.invoke('dialog:openFile', options);
  },

  // ===== 应用信息 =====

  /**
   * 获取应用版本号
   */
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('app:version');
  },

  /**
   * 获取当前平台标识
   * 这是唯一一个同步暴露的 Node.js 信息，且仅暴露平台字符串
   */
  getPlatform: (): NodeJS.Platform => {
    return process.platform;
  },

  // ===== 窗口控制 =====

  /**
   * 最小化窗口
   */
  minimizeWindow: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:minimize');
  },

  /**
   * 最大化/还原窗口
   */
  maximizeWindow: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:maximize');
  },

  /**
   * 关闭窗口
   */
  closeWindow: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:close');
  },

  /**
   * 检查窗口是否最大化
   */
  isMaximized: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:isMaximized');
  },

  // ===== 服务器配置（客户端模式） =====

  /**
   * 获取远程服务器地址。
   * 客户端模式下返回构建时配置的服务器 URL（如 http://192.168.1.100:8000）
   * 正常模式下返回空字符串。
   */
  getServerUrl: (): Promise<string> => {
    return ipcRenderer.invoke('server:get-url');
  },

  // ===== 更新事件监听（主进程 → 渲染进程单向推送） =====

  /**
   * 监听主进程发送的更新事件
   * 注意：这里使用 ipcRenderer.on 是安全的，因为是单向推送
   * 且只暴露有限的事件类型
   */
  onUpdateAvailable: (callback: (info: unknown) => void): void => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
  },

  onUpdateDownloadProgress: (callback: (progress: unknown) => void): void => {
    ipcRenderer.on('update:download-progress', (_event, progress) => callback(progress));
  },

  onUpdateError: (callback: (error: { message: string }) => void): void => {
    ipcRenderer.on('update:error', (_event, error) => callback(error));
  },

  /**
   * 移除更新事件监听
   */
  removeUpdateListeners: (): void => {
    ipcRenderer.removeAllListeners('update:available');
    ipcRenderer.removeAllListeners('update:download-progress');
    ipcRenderer.removeAllListeners('update:error');
  },
});