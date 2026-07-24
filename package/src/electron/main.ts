/**
 * Electron 主进程入口
 *
 * 负责：
 * 1. 应用生命周期管理
 * 2. 创建主窗口（安全配置）
 * 3. 设置 CSP 安全头
 * 4. 启动 Python 后端子进程（正常模式）/ 连接远程服务器（客户端模式）
 * 5. 注册 IPC 处理器
 * 6. 开发/生产环境切换
 * 7. 窗口关闭时清理资源
 *
 * 两种运行模式：
 * - 正常模式（默认）：启动 Python 后端 → 加载前端
 * - 客户端模式（通过 app-config.json）：连接远程服务器 → 加载前端，不启动后端
 */

import {
  app,
  BrowserWindow,
  session,
  shell,
  Menu,
  screen,
} from 'electron';
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { PythonBridge } from './python-bridge';
import { registerIpcHandlers, unregisterIpcHandlers, setWindowRef, setServerUrl } from './ipc-handlers';
import { initializeUpdater, setUpdaterWindowRef, scheduleUpdateCheck } from './updater';

// ===== 常量 =====

/** 开发环境 Vite 前端地址 */
const DEV_FRONTEND_URL = 'http://localhost:5173';

/** 窗口最小尺寸 */
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

/** 是否是开发环境 */
const isDev = !app.isPackaged;

// ===== 服务器配置（客户端模式）=====

/**
 * 从 app-config.json 读取服务器配置。
 * 客户端模式下，此文件由 build-exe.bat 在构建时生成。
 */
interface AppConfig {
  serverUrl?: string;
  mode?: string;
}

function loadAppConfig(): AppConfig {
  // 1. 先尝试 app-config.json（构建时写入）
  try {
    const configPath = isDev
      ? path.join(__dirname, 'app-config.json')
      : path.join(process.resourcesPath, 'app-config.json');

    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AppConfig;
      if (cfg.serverUrl) return cfg;
    }
  } catch (err) {
    console.warn('[Main] 读取 app-config.json 失败:', err);
  }

  // 2. 再尝试 electron-store（用户在设置页面输入的地址）
  try {
    const storePath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      // electron-store 存储加密值的格式
      const url = store.server_url || (store._encrypted && store._encrypted.server_url);
      if (url && typeof url === 'string' && url.startsWith('http')) {
        return { serverUrl: url };
      }
    }
  } catch (err) {
    console.warn('[Main] 读取 store 失败:', err);
  }

  return {};
}

const appConfig = loadAppConfig();
const SERVER_URL = appConfig.serverUrl || '';
const IS_CLIENT_MODE = !!SERVER_URL || appConfig.mode === 'client';

// ===== 全局状态 =====

let mainWindow: BrowserWindow | null = null;
let pythonBridge: PythonBridge | null = null;

// ===== 应用生命周期 =====

app.whenReady().then(async () => {
  const modeStr = IS_CLIENT_MODE ? '客户端' : '正常';
  console.log('[Main] 应用启动 -- 环境:', isDev ? '开发' : '生产', '模式:', modeStr);

  // 设置 CSP 安全头
  setupCSP();

  // 注册 IPC 处理器
  registerIpcHandlers();
  if (IS_CLIENT_MODE) {
    setServerUrl(SERVER_URL);
  }

  // 创建主窗口
  mainWindow = createMainWindow();
  setWindowRef(mainWindow);
  setUpdaterWindowRef(mainWindow);

  // 设置应用菜单
  setupMenu();

  if (IS_CLIENT_MODE) {
    // 客户端模式：检查服务器地址配置
    console.log('[Main] 客户端模式，服务器地址:', SERVER_URL);
    if (SERVER_URL) {
      loadFrontend();
    } else {
      // 没有配置服务器地址，显示设置页面
      showSetupPage();
    }
  } else if (isDev) {
    // 开发环境：直接加载前端（假设后端已独立启动）
    console.log('[Main] 开发环境，加载前端:', DEV_FRONTEND_URL);
    setTimeout(() => loadFrontend(), 500);
  } else {
    // 生产环境正常模式：先启动 Python 后端，就绪后再加载前端
    pythonBridge = new PythonBridge();
    setupPythonBridgeListeners(pythonBridge);
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

  // 停止 Python 子进程（正常模式下）
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
 * - nodeIntegration: false
 * - contextIsolation: true
 * - sandbox: true
 * - webSecurity: true
 * - allowRunningInsecureContent: false
 * - webviewTag: false
 */
function createMainWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const defaultWidth = Math.min(1400, Math.floor(screenWidth * 0.8));
  const defaultHeight = Math.min(900, Math.floor(screenHeight * 0.85));

  const win = new BrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: IS_CLIENT_MODE ? 'BLA 评委端' : 'IPDagents',
    show: false,
    backgroundColor: '#1a1a2e',
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
      devTools: isDev,
    },
  });

  if (!isDev) {
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
  }

  win.on('ready-to-show', () => {
    win.show();
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  win.on('closed', () => {
    mainWindow = null;
  });

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
 */
function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* ws://localhost:*",
      "frame-src 'self'",
      "media-src 'self'",
    ];

    // 客户端模式下额外允许连接远程服务器
    if (IS_CLIENT_MODE && SERVER_URL) {
      try {
        const u = new URL(SERVER_URL);
        csp.push("connect-src 'self' " + u.origin + ' ws://' + u.hostname + ':*');
      } catch (_e) {
        // URL 解析失败，跳过
      }
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp.join('; ')],
      },
    });
  });

  console.log('[Main] CSP 安全头已设置');
}

// ===== 应用菜单 =====

function setupMenu(): void {
  const appLabel = IS_CLIENT_MODE ? 'BLA 评委端' : 'IPDagents';
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: appLabel,
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

function loadFrontend(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error('[Main] 无法加载前端：窗口不存在');
    return;
  }

  if (IS_CLIENT_MODE) {
    // 客户端模式：加载远程服务器 URL
    const targetUrl = isDev ? DEV_FRONTEND_URL : SERVER_URL;
    mainWindow.loadURL(targetUrl).catch((err) => {
      console.error('[Main] 连接服务器失败 (', targetUrl, '):', err.message);
      showErrorPage(
        '无法连接到 BLA 服务器：' + targetUrl + '\n请确认服务器已启动，网络连接正常。',
        true,
      );
    });
  } else if (isDev) {
    mainWindow.loadURL(DEV_FRONTEND_URL).catch((err) => {
      console.error('[Main] 加载前端失败 (', DEV_FRONTEND_URL, '):', err.message);
      showErrorPage('无法连接到开发服务器 ' + DEV_FRONTEND_URL);
    });
  } else {
    // 正常模式生产环境：加载打包后的前端文件
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Main] 加载前端文件失败 (', indexPath, '):', err.message);
      showErrorPage('加载前端页面失败，请重新安装应用。');
    });
  }
}

// ===== Python 后端桥接监听（正常模式）=====

function setupPythonBridgeListeners(bridge: PythonBridge): void {
  bridge.on('ready', () => {
    console.log('[Main] Python 后端就绪，加载前端...');
    loadFrontend();
  });

  bridge.on('exit', (code, signal) => {
    console.log('[Main] Python 后端退出: code=', code, 'signal=', signal);
  });

  bridge.on('stdout', (line: string) => {
    // 在生产环境，将 Python 日志写入文件
    if (!isDev) {
      // 日志持久化
    }
  });

  bridge.on('stderr', (line: string) => {
    if (!isDev) {
      // 日志持久化
    }
  });

  bridge.on('crash', (reason: string) => {
    console.error('[Main] Python 后端崩溃:', reason);
    showErrorPage(
      'Python 后端服务异常：' + reason,
      true,
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

function showErrorPage(message: string, showActions: boolean = false): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const title = IS_CLIENT_MODE ? 'BLA 评委端' : 'IPDagents';

  const actionsHtml = showActions
    ? `
    <div class="actions">
      <button class="btn btn-primary" onclick="location.reload()">查看日志</button>
      <button class="btn btn-secondary" onclick="location.reload()">联系支持</button>
    </div>`
    : '';

  const html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>' + title + ' - 错误</title>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
    + 'background:#1a1a2e;color:#e0e0e0;display:flex;justify-content:center;'
    + 'align-items:center;height:100vh;flex-direction:column;padding:40px}'
    + '.error-icon{font-size:64px;margin-bottom:24px;opacity:0.8}'
    + 'h1{font-size:24px;margin-bottom:16px;color:#ff6b6b}'
    + 'p{font-size:16px;text-align:center;max-width:500px;line-height:1.6;color:#a0a0b0;margin-bottom:32px}'
    + '.actions{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}'
    + '.btn{padding:10px 24px;border:none;border-radius:6px;font-size:14px;cursor:pointer;transition:opacity 0.2s}'
    + '.btn:hover{opacity:0.85}'
    + '.btn-primary{background:#4a6cf7;color:#fff}'
    + '.btn-secondary{background:#2d2d44;color:#e0e0e0;border:1px solid #3d3d5c}'
    + '</style></head><body>'
    + '<div class="error-icon">⚠</div>'
    + '<h1>应用启动失败</h1>'
    + '<p>' + message + '</p>'
    + actionsHtml
    + '</body></html>';

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)).catch((err) => {
    console.error('[Main] 加载错误页面失败:', err);
  });
}

// ===== 工具函数 =====


/**
 * 显示服务器设置页面（客户端模式首次使用，或需要更改服务器地址时）
 */
function showSetupPage(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>BLA Judge Client - Setup</title>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;'
    + 'background:#1a1a2e;color:#e0e0e0;display:flex;justify-content:center;'
    + 'align-items:center;height:100vh;flex-direction:column;padding:40px}'
    + '.container{background:#16213e;border-radius:12px;padding:40px;width:480px;max-width:90vw}'
    + 'h1{font-size:22px;margin-bottom:8px;color:#00d4ff}'
    + '.sub{font-size:14px;color:#8892b0;margin-bottom:24px}'
    + 'label{font-size:14px;color:#ccd6f6;display:block;margin-bottom:6px}'
    + 'input{width:100%;padding:12px 16px;background:#0a192f;border:1px solid #2d3a5c;'
    + 'border-radius:6px;color:#e0e0e0;font-size:16px;outline:none;margin-bottom:20px}'
    + 'input:focus{border-color:#00d4ff}'
    + 'input::placeholder{color:#4a5a7a}'
    + '.btn{width:100%;padding:12px;background:#00d4ff;color:#0a192f;border:none;'
    + 'border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;transition:opacity 0.2s}'
    + '.btn:hover{opacity:0.85}'
    + '.hint{font-size:12px;color:#4a5a7a;margin-top:12px;text-align:center}'
    + '#status{margin-top:12px;text-align:center;font-size:13px}'
    + '.loading{color:#ffd700}.success{color:#64ffda}.error{color:#ff6b6b}'
    + '</style></head><body>'
    + '<div class="container">'
    + '<h1>BLA Judge Client</h1>'
    + '<p class="sub">Enter the server address provided by the presenter</p>'
    + '<label for="serverUrl">Server Address</label>'
    + '<input type="text" id="serverUrl" placeholder="e.g. http://192.168.1.100:8000 or https://xxx.trycloudflare.com"'
    + ' value="http://localhost:8000">'
    + '<button class="btn" id="connectBtn" onclick="connect()">Connect</button>'
    + '<div id="status"></div>'
    + '<p class="hint">Ask the presenter for the server address shown on their screen</p>'
    + '</div>'
    + '<script>'
    + 'var btn=document.getElementById("connectBtn");'
    + 'var input=document.getElementById("serverUrl");'
    + 'function connect(){'
    + 'var url=input.value.trim();'
    + 'if(!url){document.getElementById("status").innerHTML="<span class=error>Please enter an address</span>";return}'
    + 'if(!url.startsWith("http"))url="http://"+url;'
    + 'document.getElementById("status").innerHTML="<span class=loading>Connecting...</span>";'
    + 'btn.disabled=true;'
    + 'try{window.electronAPI.setSecure("server_url",url).then(function(){'
    + 'document.getElementById("status").innerHTML="<span class=success>Saved! Reloading...</span>";'
    + 'setTimeout(function(){location.reload()},1000);'
    + '})}catch(e){'
    + 'document.getElementById("status").innerHTML="<span class=error>Error: "+e.message+"</span>";'
    + 'btn.disabled=false}}'
    + 'input.addEventListener("keydown",function(e){if(e.key==="Enter")connect()});'
    + '</script></body></html>';

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html)).catch((err) => {
    console.error('[Main] 加载设置页面失败:', err);
  });
}


function getIconPath(): string {
  if (process.resourcesPath) {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(process.resourcesPath, iconName);
  }
  return '';
}
