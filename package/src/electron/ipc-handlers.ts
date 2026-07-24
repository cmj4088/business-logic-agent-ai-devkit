/**
 * IPC 处理器注册模块
 *
 * 将所有 IPC 处理器注册到主进程的 ipcMain 上。
 * 每个 handler 处理一个特定的 IPC channel。
 *
 * 安全设计：
 * - 所有 handler 使用 ipcMain.handle（异步请求-响应模式）
 * - 不使用 ipcMain.on（推送模式），避免渲染进程权限过大
 * - 所有输入参数经过校验
 */
import { ipcMain, dialog, Notification, app, BrowserWindow, OpenDialogOptions } from 'electron';
import { setSecureValue, getSecureValue, deleteSecureValue } from './store';

/**
 * 获取发送事件的 BrowserWindow 引用
 * 传入 null 表示由调用方传入窗口引用
 */
let windowRef: BrowserWindow | null = null;

/**
 * 服务器 URL（客户端模式下使用）
 * 由主进程在启动时设置
 */
let serverUrl: string = '';
export function setServerUrl(url: string): void {
  serverUrl = url;
}

/**
 * 设置窗口引用（在 main.ts 创建窗口后调用）
 */
export function setWindowRef(win: BrowserWindow): void {
  windowRef = win;
}

/**
 * 校验输入：确保字符串参数非空
 */
function validateStringArg(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`参数 "${name}" 必须是非空字符串`);
  }
}

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  // ===== 安全存储 =====

  ipcMain.handle('store:get', async (_event, key: unknown) => {
    validateStringArg(key, 'key');
    return getSecureValue(key);
  });

  ipcMain.handle('store:set', async (_event, key: unknown, value: unknown) => {
    validateStringArg(key, 'key');
    validateStringArg(value, 'value');
    setSecureValue(key, value);
    return true;
  });

  ipcMain.handle('store:delete', async (_event, key: unknown) => {
    validateStringArg(key, 'key');
    deleteSecureValue(key);
    return true;
  });

  // ===== 系统通知 =====

  ipcMain.handle('notification:show', async (_event, title: unknown, body: unknown) => {
    validateStringArg(title, 'title');
    validateStringArg(body, 'body');

    if (!Notification.isSupported()) {
      console.warn('[IPC] 系统通知不支持');
      return false;
    }

    const notification = new Notification({
      title,
      body,
      urgency: 'normal',
    });

    notification.show();
    return true;
  });

  // ===== 文件对话框 =====

  ipcMain.handle('dialog:openFile', async (_event, options: unknown) => {
    if (!windowRef) {
      throw new Error('窗口引用未初始化');
    }

    const opts = options as {
      filters?: { name: string; extensions: string[] }[];
      properties?: OpenDialogOptions['properties'];
    } | undefined;

    const result = await dialog.showOpenDialog(windowRef, {
      properties: opts?.properties ?? ['openFile'],
      filters: opts?.filters ?? [],
    });

    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });

  // ===== 应用信息 =====

  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  // ===== 窗口控制 =====

  ipcMain.handle('window:minimize', async () => {
    windowRef?.minimize();
    return true;
  });

  ipcMain.handle('window:maximize', async () => {
    if (!windowRef) return false;
    if (windowRef.isMaximized()) {
      windowRef.unmaximize();
    } else {
      windowRef.maximize();
    }
    return true;
  });

  ipcMain.handle('window:close', async () => {
    windowRef?.close();
    return true;
  });

  ipcMain.handle('window:isMaximized', async () => {
    return windowRef?.isMaximized() ?? false;
  });

  // ===== 服务器配置（客户端模式）=====

  ipcMain.handle('server:get-url', async () => {
    return serverUrl;
  });

  console.log('[IPC] 所有 IPC 处理器已注册');
}

/**
 * 注销所有 IPC 处理器（应用退出时调用）
 */
export function unregisterIpcHandlers(): void {
  const channels = [
    'store:get', 'store:set', 'store:delete',
    'notification:show',
    'dialog:openFile',
    'app:version',
    'window:minimize', 'window:maximize', 'window:close', 'window:isMaximized',
    'server:get-url',
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }

  console.log('[IPC] 所有 IPC 处理器已注销');
}