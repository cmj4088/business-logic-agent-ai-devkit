/**
 * Electron 主进程入口
 *
 * 负责：
 * 1. 应用生命周期管理
 * 2. 创建主窗口（安全配置）
 * 3. 设置 CSP 安全头
 * 4. 启动 Python 后端子进程
 * 5. 注册 IPC 处理器
 * 6. 开发/生产环境切换
 * 7. 窗口关闭时清理资源
 */

import {
  app,
  BrowserWindow,
  session,
  shell,
  Menu,
  screen,
} from 'electron';
import path from 'path';
import { PythonBridge } from './python-bridge';
import { registerIpcHandlers, unregisterIpcHandlers, setWindowRef } from './ipc-handlers';
import { initializeUpdater, setUpdaterWindowRef, scheduleUpdateCheck } from './updater';

// ===== 常量 =====

/** 开发环境 Vite 前端地址 */
const DEV_FRONTEND_URL = 'http://localhost:5173';

/** 窗口最小尺寸 */
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

/** 是否是开发环境 */
const isDev = !app.isPackaged;

// ===== 全局状态 =====

let mainWindow: BrowserWindow | null = null;
let pythonBridge: PythonBridge | null = null;

// ===== 应用生命周期 =====

app.whenReady().then(async () => {
  console.log(`[Main] 应用启动 — 环境: ${isDev ? '开发' : '生产'}`);

  // 设置 CSP 安全头
  setupCSP();

  // 注册 IPC 处理器
  registerIpcHandlers();

  // 创建主窗口
  mainWindow = createMainWindow();
  setWindowRef(mainWindow);
  setUpdaterWindowRef(mainWindow);

  // 设置应用菜单
  setupMenu();

  // 启动 Python 后端
  pythonBridge = new PythonBridge();
  setupPythonBridgeListeners(pythonBridge);

  if (isDev) {
    // 开发环境：直接加载前端（假设后端已独立启动）
    console.log(`[Main] 开发环境，加载前端: ${DEV_FRONTEND_URL}`);
    setTimeout(() => loadFrontend(), 500);
  } else {
    // 生产环境：先启动 Python 后端，就绪后再加载前端
    pythonBridge.start();
  }

  // 初始化自动更新
  initializeUpdater();
  scheduleUpdateCheck();

  // macOS: 点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      setWindowRef(mainWindow);
      setUpdaterWindowRef(mainWindow);
      loadFrontend();
    }
  });
});

/**
 * 所有窗口关闭时
 * - macOS：保持应用运行（符合 macOS 惯例）
 * - 其他平台：退出应用
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 应用即将退出时的清理
 */
app.on('before-quit', async () => {
  console.log('[Main] 应用即将退出，清理资源...');

  // 停止 Python 子进程
  if (pythonBridge) {
    try {
      await pythonBridge.stop();
    } catch (err) {
      console.error('[Main] 停止 Python 后端失败:', err);
      pythonBridge.forceStop();
    }
    pythonBridge = null;
  }

  // 注销 IPC 处理器
  unregisterIpcHandlers();

  // 销毁窗口
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }
});

// ===== 窗口创建 =====

/**
 * 创建主窗口
 *
 * 安全配置（必须严格遵守）：
 * - nodeIntegration: false — 禁止渲染进程访问 Node.js
 * - contextIsolation: true — 隔离 preload 和渲染进程
 * - sandbox: true — 沙箱模式
 * - webSecurity: true — 启用 Web 安全策略
 * - allowRunningInsecureContent: false — 禁止不安全内容
 * - webviewTag: false — 禁用 webview 标签
 */
function createMainWindow(): BrowserWindow {
  // 获取屏幕工作区尺寸，计算默认窗口大小
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const defaultWidth = Math.min(1400, Math.floor(screenWidth * 0.8));
  const defaultHeight = Math.min(900, Math.floor(screenHeight * 0.85));

  const win = new BrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: 'IPDagents',
    show: false, // 先隐藏，ready-to-show 后再显示（避免白屏闪烁）
    backgroundColor: '#1a1a2e', // 深色背景，与应用主题一致
    icon: getIconPath(),
    webPreferences: {
      // === 安全隔离 ===
      nodeIntegration: false,         // 禁止渲染进程访问 Node.js
      contextIsolation: true,         // 隔离 preload 和渲染进程
      sandbox: true,                  // 沙箱模式
      webSecurity: true,              // 启用 Web 安全策略
      allowRunningInsecureContent: false, // 禁止不安全内容
      webviewTag: false,              // 禁用 webview 标签

      // === preload 脚本 ===
      preload: path.join(__dirname, 'preload.js'),

      // === 其他 ===
      spellcheck: false,
      devTools: isDev,               // 生产环境关闭 DevTools
    },
  });

  // 强制移除菜单中的 DevTools 快捷键（生产环境）
  if (!isDev) {
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
  }

  // 窗口就绪后显示
  win.on('ready-to-show', () => {
    win.show();
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // 窗口关闭时清理引用
  win.on('closed', () => {
    mainWindow = null;
  });

  // 拦截外部链接，在系统浏览器中打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url).catch((err) => {
        console.error('[Main] 打开外部链接失败:', err);
      });
    }
    return { action: 'deny' };
  });

  return win;
}

// ===== CSP 安全头 =====

/**
 * 设置 Content-Security-Policy 头
 *
 * 安全策略：
 * - default-src 'self' — 默认只允许同源资源
 * - script-src 'self' — 禁止内联脚本和外部脚本
 * - style-src 'self' 'unsafe-inline' — 允许内联样式（Vite dev 需要）
 * - connect-src 'self' http://localhost:* ws://localhost:* — 允许连接本地后端
 */
function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* ws://localhost:*",
      "frame-src 'self'",
      "media-src 'self'",
    ];

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspDirectives.join('; ')],
      },
    });
  });

  console.log('[Main] CSP 安全头已设置');
}

// ===== 应用菜单 =====

/**
 * 设置应用菜单（最小化菜单，无开发者工具入口）
 */
function setupMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'IPDagents',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' as const }, { role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '查看日志',
          click: () => {
            const logPath = path.join(app.getPath('userData'), 'logs');
            shell.openPath(logPath).catch((err) => {
              console.error('[Main] 打开日志目录失败:', err);
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ===== 前端加载 =====

/**
 * 加载前端页面
 *
 * 开发环境：加载 Vite dev server
 * 生产环境：加载打包后的 dist 文件
 */
function loadFrontend(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error('[Main] 无法加载前端：窗口不存在');
    return;
  }

  if (isDev) {
    mainWindow.loadURL(DEV_FRONTEND_URL).catch((err) => {
      console.error(`[Main] 加载前端失败 (${DEV_FRONTEND_URL}):`, err.message);
      showErrorPage(`无法连接到开发服务器 ${DEV_FRONTEND_URL}，请确保 Vite dev server 已启动。`);
    });
  } else {
    // 生产环境加载打包后的文件
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error(`[Main] 加载前端文件失败 (${indexPath}):`, err.message);
      showErrorPage('加载前端页面失败，请重新安装应用。');
    });
  }
}

// ===== Python 后端桥接监听 =====

/**
 * 设置 Python 子进程的事件监听
 */
function setupPythonBridgeListeners(bridge: PythonBridge): void {
  bridge.on('ready', () => {
    console.log(`[Main] Python 后端就绪，加载前端...`);
    loadFrontend();
  });

  bridge.on('exit', (code, signal) => {
    console.log(`[Main] Python 后端退出: code=${code}, signal=${signal}`);
  });

  bridge.on('stdout', (line: string) => {
    // 在生产环境，将 Python 日志写入文件
    if (!isDev) {
      // 可以在这里添加日志持久化逻辑
    }
  });

  bridge.on('stderr', (line: string) => {
    // 在生产环境，将 Python 错误写入文件
    if (!isDev) {
      // 可以在这里添加日志持久化逻辑
    }
  });

  bridge.on('crash', (reason: string) => {
    console.error(`[Main] Python 后端崩溃: ${reason}`);
    showErrorPage(
      `Python 后端服务异常：${reason}`,
      true, // 显示"查看日志"和"联系支持"按钮
    );
  });

  bridge.on('healthStatus', (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend:healthStatus', status);
    }
  });

  console.log('[Main] Python Bridge 监听器已设置');
}

// ===== 错误页面 =====

/**
 * 显示错误页面
 *
 * 当 Python 后端崩溃或前端加载失败时显示。
 * 内联 HTML 避免依赖外部文件加载。
 */
function showErrorPage(
  message: string,
  showActions: boolean = false,
): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const actionsHtml = showActions
    ? `
    <div class="actions">
      <button class="btn btn-primary" onclick="openLogs()">查看日志</button>
      <button class="btn btn-secondary" onclick="contactSupport()">联系支持</button>
    </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPDagents - 错误</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
      padding: 40px;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 24px;
      opacity: 0.8;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      color: #ff6b6b;
    }
    p {
      font-size: 16px;
      text-align: center;
      max-width: 500px;
      line-height: 1.6;
      color: #a0a0b0;
      margin-bottom: 32px;
    }
    .actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary {
      background: #4a6cf7;
      color: white;
    }
    .btn-secondary {
      background: #2d2d44;
      color: #e0e0e0;
      border: 1px solid #3d3d5c;
    }
  </style>
</head>
<body>
  <div class="error-icon">&#9888;</div>
  <h1>应用启动失败</h1>
  <p>${message}</p>
  ${actionsHtml}
  <script>
    function openLogs() {
      // 通过 IPC 打开日志目录
      try {
        window.electronAPI?.getSecure?.('log_path');
      } catch(e) {}
      // 降级：刷新页面
      location.reload();
    }
    function contactSupport() {
      // 通过 IPC 打开帮助链接
      try {
        window.electronAPI?.getSecure?.('support_url');
      } catch(e) {}
      location.reload();
    }
  </script>
</body>
</html>`;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch((err) => {
    console.error('[Main] 加载错误页面失败:', err);
  });
}

// ===== 工具函数 =====

/**
 * 获取应用图标路径
 */
function getIconPath(): string {
  if (process.resourcesPath) {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(process.resourcesPath, iconName);
  }
  return '';
}