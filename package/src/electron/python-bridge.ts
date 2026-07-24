/**
 * Python 后端子进程管理模块
 *
 * 负责：
 * 1. 检测 Python 环境（PyInstaller 打包后使用内置 Python）
 * 2. 启动 FastAPI 子进程（uvicorn）
 * 3. 轮询 /api/health 等待就绪（最多 30 秒）
 * 4. 崩溃恢复（自动重启最多 3 次）
 * 5. 优雅关闭（SIGTERM → 5 秒超时 → SIGKILL）
 */
import { ChildProcess, spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import http from 'http';

/** Python 子进程事件 */
export interface PythonBridgeEvents {
  /** 后端就绪（健康检查通过） */
  ready: () => void;
  /** 后端进程退出 */
  exit: (code: number | null, signal: string | null) => void;
  /** 标准输出行 */
  stdout: (line: string) => void;
  /** 标准错误行 */
  stderr: (line: string) => void;
  /** 崩溃恢复失败（超过最大重试次数） */
  crash: (reason: string) => void;
  /** 健康检查状态变化 */
  healthStatus: (status: 'checking' | 'healthy' | 'unhealthy') => void;
}

/** 最大重启次数 */
const MAX_RESTART_COUNT = 3;
/** 健康检查超时时间（毫秒） */
const HEALTH_CHECK_TIMEOUT = 30_000;
/** 健康检查轮询间隔（毫秒） */
const HEALTH_CHECK_INTERVAL = 500;
/** 优雅关闭超时（毫秒） */
const GRACEFUL_SHUTDOWN_TIMEOUT = 5_000;
/** 默认后端端口 */
const DEFAULT_PORT = 8200;

/**
 * 检测 Python 可执行文件路径
 *
 * 优先级：
 * 1. PyInstaller 打包的内置 Python（resources/python/）
 * 2. 系统 PATH 中的 python3
 * 3. 系统 PATH 中的 python
 */
function detectPythonPath(): string {
  // 生产环境：PyInstaller 打包后，资源在 process.resourcesPath 下
  if (process.resourcesPath) {
    const isWindows = process.platform === 'win32';
    const pythonDir = path.join(process.resourcesPath, 'python');
    const pythonExe = isWindows ? 'python.exe' : 'python3';
    const bundledPath = path.join(pythonDir, pythonExe);
    try {
      // 简单检查文件是否存在（同步 fs 调用）
      const fs = require('fs');
      if (fs.existsSync(bundledPath)) {
        return bundledPath;
      }
    } catch {
      // 资源路径不存在，回退到系统 Python
    }
  }

  // 开发环境：使用系统 Python
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      throw new Error('未找到可用的 Python 环境。请安装 Python 3.10+ 或确认打包资源完整。');
    }
  }
}

/**
 * 查找可用端口
 */
function findAvailablePort(): number {
  return DEFAULT_PORT;
}

/**
 * Python 后端子进程管理器
 */
export class PythonBridge extends EventEmitter {
  private childProcess: ChildProcess | null = null;
  private restartCount = 0;
  private port: number;
  private pythonPath: string;
  private shuttingDown = false;
  private healthCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private healthCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.port = findAvailablePort();
    this.pythonPath = detectPythonPath();
  }

  /**
   * 获取后端服务 URL
   */
  get backendUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * 获取后端端口
   */
  get backendPort(): number {
    return this.port;
  }

  /**
   * 启动 Python 子进程
   */
  start(): void {
    if (this.childProcess) {
      console.warn('[PythonBridge] 子进程已在运行中，跳过启动');
      return;
    }

    this.shuttingDown = false;
    this.restartCount = 0;

    const backendDir = path.resolve(__dirname, '..', 'backend');
    const mainModule = path.join('m0_infrastructure', 'main.py');

    console.log(`[PythonBridge] 启动 Python 后端...`);
    console.log(`[PythonBridge] Python: ${this.pythonPath}`);
    console.log(`[PythonBridge] 工作目录: ${backendDir}`);
    console.log(`[PythonBridge] 端口: ${this.port}`);

    this.childProcess = spawn(this.pythonPath, [
      '-m', 'uvicorn',
      `${mainModule.replace(/\\/g, '/').replace('.py', '')}:app`,
      '--host', '127.0.0.1',
      '--port', String(this.port),
      '--log-level', 'info',
    ], {
      cwd: backendDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PORT: String(this.port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // 监听 stdout
    this.childProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        console.log(`[Python stdout] ${line}`);
        this.emit('stdout', line);
      }
    });

    // 监听 stderr
    this.childProcess.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        console.error(`[Python stderr] ${line}`);
        this.emit('stderr', line);
      }
    });

    // 监听进程退出
    this.childProcess.on('exit', (code, signal) => {
      console.log(`[PythonBridge] 子进程退出: code=${code}, signal=${signal}`);
      this.childProcess = null;
      this.clearHealthCheckTimers();

      this.emit('exit', code, signal);

      // 非主动关闭时尝试重启
      if (!this.shuttingDown && code !== 0) {
        this.attemptRestart();
      }
    });

    this.childProcess.on('error', (err) => {
      console.error(`[PythonBridge] 子进程启动失败:`, err.message);
      this.childProcess = null;
      this.clearHealthCheckTimers();

      if (!this.shuttingDown) {
        this.attemptRestart();
      }
    });

    // 开始健康检查轮询
    this.startHealthCheck();
  }

  /**
   * 停止 Python 子进程（优雅关闭）
   */
  async stop(): Promise<void> {
    if (!this.childProcess) {
      console.log('[PythonBridge] 没有运行中的子进程');
      return;
    }

    this.shuttingDown = true;
    this.clearHealthCheckTimers();

    return new Promise<void>((resolve) => {
      const pid = this.childProcess!.pid;
      console.log(`[PythonBridge] 发送 SIGTERM 到 PID ${pid}...`);

      // 发送 SIGTERM
      const killed = this.childProcess!.kill('SIGTERM');
      if (!killed) {
        console.warn('[PythonBridge] SIGTERM 发送失败，尝试 SIGKILL');
        this.childProcess!.kill('SIGKILL');
        resolve();
        return;
      }

      // 等待 5 秒优雅关闭
      const forceKillTimer = setTimeout(() => {
        if (this.childProcess) {
          console.warn(`[PythonBridge] 超时 ${GRACEFUL_SHUTDOWN_TIMEOUT}ms，发送 SIGKILL...`);
          this.childProcess.kill('SIGKILL');
        }
        resolve();
      }, GRACEFUL_SHUTDOWN_TIMEOUT);

      // 监听进程退出
      this.childProcess!.once('exit', () => {
        clearTimeout(forceKillTimer);
        console.log('[PythonBridge] 子进程已退出');
        this.childProcess = null;
        resolve();
      });
    });
  }

  /**
   * 强制停止子进程
   */
  forceStop(): void {
    if (this.childProcess) {
      console.log('[PythonBridge] 强制停止子进程');
      this.shuttingDown = true;
      this.clearHealthCheckTimers();
      this.childProcess.kill('SIGKILL');
      this.childProcess = null;
    }
  }

  // ===== 健康检查 =====

  /**
   * 开始健康检查轮询
   */
  private startHealthCheck(): void {
    this.emit('healthStatus', 'checking');

    // 总体超时
    this.healthCheckTimeout = setTimeout(() => {
      console.error(`[PythonBridge] 健康检查超时（${HEALTH_CHECK_TIMEOUT}ms）`);
      this.clearHealthCheckTimers();
      this.emit('healthStatus', 'unhealthy');

      if (!this.shuttingDown) {
        this.attemptRestart();
      }
    }, HEALTH_CHECK_TIMEOUT);

    // 立即执行第一次检查
    this.performHealthCheck();
  }

  /**
   * 执行单次健康检查（递归轮询）
   */
  private performHealthCheck(): void {
    const req = http.get(
      `http://127.0.0.1:${this.port}/api/health`,
      { timeout: 2000 },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200 && data.status === 'ok') {
              console.log(`[PythonBridge] 后端就绪！版本: ${data.version}`);
              this.clearHealthCheckTimers();
              this.emit('healthStatus', 'healthy');
              this.emit('ready');
              return;
            }
          } catch {
            // JSON 解析失败，继续轮询
          }
          this.scheduleNextCheck();
        });
      }
    );

    req.on('error', () => {
      // 连接失败（后端还没启动），这是正常的轮询过程
      this.scheduleNextCheck();
    });

    req.on('timeout', () => {
      req.destroy();
      this.scheduleNextCheck();
    });
  }

  /**
   * 安排下一次健康检查
   */
  private scheduleNextCheck(): void {
    this.healthCheckTimer = setTimeout(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * 清除所有健康检查定时器
   */
  private clearHealthCheckTimers(): void {
    if (this.healthCheckTimer) {
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    if (this.healthCheckTimeout) {
      clearTimeout(this.healthCheckTimeout);
      this.healthCheckTimeout = null;
    }
  }

  // ===== 崩溃恢复 =====

  /**
   * 尝试重启子进程
   */
  private attemptRestart(): void {
    this.restartCount++;

    if (this.restartCount > MAX_RESTART_COUNT) {
      const reason = `Python 后端崩溃并重启 ${MAX_RESTART_COUNT} 次失败，已停止自动恢复`;
      console.error(`[PythonBridge] ${reason}`);
      this.emit('crash', reason);
      return;
    }

    console.log(`[PythonBridge] 第 ${this.restartCount}/${MAX_RESTART_COUNT} 次重启...`);

    // 延迟 2 秒后重启，避免快速循环
    setTimeout(() => {
      if (!this.shuttingDown) {
        this.start();
      }
    }, 2000);
  }
}