/**
 * 自动更新模块
 *
 * 使用 electron-updater 实现应用自动更新。
 *
 * 生产环境配置：
 * - 更新源：从 GitHub Releases 或自定义更新服务器获取
 * - 下载完成后提示用户重启
 * - 支持静默下载和手动检查更新
 *
 * 开发环境：自动更新不启用。
 */
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { app } from 'electron';

/** 是否允许自动下载更新 */
let autoDownload = true;

/** 主窗口引用 */
let windowRef: BrowserWindow | null = null;

/**
 * 设置窗口引用
 */
export function setUpdaterWindowRef(win: BrowserWindow): void {
  windowRef = win;
}

/**
 * 配置并初始化自动更新
 */
export function initializeUpdater(): void {
  // 开发环境不启用自动更新
  if (!app.isPackaged) {
    console.log('[Updater] 开发环境，自动更新未启用');
    return;
  }

  // 配置更新源
  autoUpdater.autoDownload = autoDownload;
  autoUpdater.autoInstallOnAppQuit = true;

  // 更新检查完成
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] 正在检查更新...');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[Updater] 发现新版本: ${info.version}`);
    if (windowRef) {
      windowRef.webContents.send('update:available', info);
    }
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log(`[Updater] 当前已是最新版本: ${info.version}`);
  });

  // 下载进度
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    console.log(`[Updater] 下载进度: ${Math.round(progress.percent)}%`);
    if (windowRef) {
      windowRef.webContents.send('update:download-progress', progress);
    }
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
    console.log(`[Updater] 更新已下载: ${info.version}`);

    if (!windowRef) return;

    const result = await dialog.showMessageBox(windowRef, {
      type: 'info',
      title: '发现新版本',
      message: `新版本 ${info.version} 已下载完成。`,
      detail: '是否立即重启应用以完成更新？',
      buttons: ['立即重启', '稍后提醒'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      // 用户选择立即重启
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
    }
  });

  // 更新出错
  autoUpdater.on('error', (error: Error) => {
    console.error(`[Updater] 更新出错:`, error.message);
    if (windowRef) {
      windowRef.webContents.send('update:error', { message: error.message });
    }
  });
}

/**
 * 手动检查更新
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  if (!app.isPackaged) {
    console.log('[Updater] 开发环境，跳过手动检查更新');
    return null;
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    return result?.updateInfo ?? null;
  } catch (error) {
    console.error('[Updater] 检查更新失败:', error);
    return null;
  }
}

/**
 * 设置是否自动下载更新
 */
export function setAutoDownload(enabled: boolean): void {
  autoDownload = enabled;
  autoUpdater.autoDownload = enabled;
}

/**
 * 启动后自动检查更新（延迟 5 秒）
 */
export function scheduleUpdateCheck(delayMs: number = 5_000): void {
  if (!app.isPackaged) return;

  setTimeout(() => {
    checkForUpdates().catch((err) => {
      console.error('[Updater] 自动检查更新失败:', err);
    });
  }, delayMs);
}