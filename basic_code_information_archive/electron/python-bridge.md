# python-bridge.ts — Python 后端子进程管理模块

## 概述
该文件负责管理 **Python 后端 FastAPI 子进程**的完整生命周期。它使用 Node.js 的 `child_process.spawn` 启动 Python 进程，通过健康检查轮询确认后端就绪，支持崩溃自动恢复（最多 3 次），以及优雅关闭（SIGTERM → 超时 → SIGKILL）。继承自 `EventEmitter`，通过事件向主进程报告状态变化。

## 接口定义

### PythonBridgeEvents
定义了 PythonBridge 可能发出的所有事件类型：
- **ready()**: 后端就绪（健康检查通过）
- **exit(code, signal)**: 后端进程退出
- **stdout(line)**: 标准输出行
- **stderr(line)**: 标准错误行
- **crash(reason)**: 崩溃恢复失败（超过最大重试次数）
- **healthStatus(status)**: 健康检查状态变化（`'checking' | 'healthy' | 'unhealthy'`）

## 常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `MAX_RESTART_COUNT` | 3 | 最大自动重启次数 |
| `HEALTH_CHECK_TIMEOUT` | 30000ms | 健康检查总超时时间 |
| `HEALTH_CHECK_INTERVAL` | 500ms | 健康检查轮询间隔 |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | 5000ms | 优雅关闭超时（超时后 SIGKILL） |
| `DEFAULT_PORT` | 8200 | 默认后端端口 |

## 函数详细说明

### detectPythonPath()
- **功能**: 检测 Python 可执行文件路径
- **返回值**: Python 可执行文件的路径字符串
- **关键逻辑**（优先级从高到低）:
  1. PyInstaller 打包的内置 Python（`resources/python/` 目录下）
  2. 系统 PATH 中的 `python3` 命令
  3. 系统 PATH 中的 `python` 命令
  4. 都找不到则抛出异常
- **平台适配**: Windows 查找 `python.exe`，其他平台查找 `python3`

### findAvailablePort()
- **功能**: 查找可用端口（目前固定返回 `DEFAULT_PORT`）
- **返回值**: `number`

## 类详细说明

### PythonBridge（继承 EventEmitter）

#### 构造函数
- **功能**: 初始化后端端口和 Python 路径
- **关键逻辑**: 调用 `detectPythonPath()` 和 `findAvailablePort()`

#### 属性
- **backendUrl**: 只读，返回 `http://localhost:${port}` 格式的后端地址
- **backendPort**: 只读，返回后端端口号

#### start()
- **功能**: 启动 Python 后端子进程
- **关键逻辑**:
  1. 检查是否已有运行中的子进程，避免重复启动
  2. 重置关闭标志和重启计数
  3. 使用 `spawn` 启动 Python 进程，运行 `uvicorn` 启动 FastAPI
  4. 工作目录设为 `backend/`，入口模块为 `m0_infrastructure/main.py`
  5. 设置 `PYTHONUNBUFFERED=1` 确保日志实时输出
  6. 监听 `stdout`、`stderr` 数据流，按行分割后发送事件
  7. 监听 `exit` 事件：非主动关闭且退出码非 0 时尝试重启
  8. 监听 `error` 事件：非关闭状态时尝试重启
  9. 启动后立即开始健康检查轮询

#### stop()
- **功能**: 优雅关闭子进程
- **返回值**: `Promise<void>`
- **关键逻辑**:
  1. 设置 `shuttingDown = true`
  2. 发送 `SIGTERM` 信号
  3. 等待最多 5 秒（`GRACEFUL_SHUTDOWN_TIMEOUT`）
  4. 超时则发送 `SIGKILL` 强制终止
  5. 监听 `exit` 事件确认进程已退出

#### forceStop()
- **功能**: 强制停止子进程（直接发送 SIGKILL）
- **关键逻辑**: 不等待优雅关闭，立即终止

#### startHealthCheck()（私有）
- **功能**: 开始健康检查轮询
- **关键逻辑**:
  - 立即发送 `healthStatus: 'checking'` 事件
  - 设置 30 秒总超时定时器
  - 立即执行第一次健康检查
  - 超时后发送 `healthStatus: 'unhealthy'` 并尝试重启

#### performHealthCheck()（私有）
- **功能**: 执行单次健康检查（递归轮询）
- **关键逻辑**:
  - 向 `http://127.0.0.1:${port}/api/health` 发送 GET 请求（2 秒超时）
  - 检查响应状态码是否为 200 且 `data.status === 'ok'`
  - 成功：清除定时器，发送 `healthy` 和 `ready` 事件
  - 失败：安排下一次检查（500ms 后）

#### scheduleNextCheck()（私有）
- **功能**: 安排下一次健康检查（延迟 `HEALTH_CHECK_INTERVAL` ms）

#### clearHealthCheckTimers()（私有）
- **功能**: 清除所有健康检查相关的定时器

#### attemptRestart()（私有）
- **功能**: 尝试重启子进程
- **关键逻辑**:
  - 递增重启计数
  - 超过 `MAX_RESTART_COUNT` 次：发送 `crash` 事件并停止
  - 未超过：延迟 2 秒后调用 `start()` 重新启动

## 崩溃恢复流程

1. 子进程异常退出（exit code != 0）或启动失败（error 事件）
2. 检查 `shuttingDown` 标志，主动关闭时不重启
3. 递增 `restartCount`
4. 未超过 3 次：延迟 2 秒后重新 `start()`
5. 超过 3 次：发送 `crash` 事件通知主进程

## 依赖关系
- `child_process` — `spawn`, `execSync`, `ChildProcess`
- `events` — `EventEmitter`
- `path` — 路径处理
- `http` — 健康检查 HTTP 请求
- `fs` — 检测打包后的 Python 文件是否存在

## 注意事项
- 健康检查端点为 `/api/health`，后端必须实现此接口
- 生产环境依赖 PyInstaller 打包内置 Python，开发环境使用系统 Python
- 健康检查超时 30 秒，如果后端启动较慢可能需要调整
- Windows 平台 SIGTERM 行为与 Unix 不同，可能直接终止进程
- 崩溃恢复最多 3 次，之后需要用户手动干预
- `fs` 模块在 `detectPythonPath` 中通过 `require` 动态加载，避免在不需要时加载