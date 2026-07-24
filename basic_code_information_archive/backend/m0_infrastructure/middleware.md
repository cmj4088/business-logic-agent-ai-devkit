# middleware.py — 全局中间件

## 概述
该文件是 M0 基础设施层的中间件模块，提供两个自定义 HTTP 中间件：`RequestIDMiddleware` 用于为每个请求注入唯一追踪 ID，`RequestLoggingMiddleware` 用于记录请求的完整日志（方法、路径、状态码、耗时）。两个中间件均基于 Starlette 的 `BaseHTTPMiddleware` 实现。

## 函数/类详细说明

### RequestIDMiddleware
- **功能**: 为每个 HTTP 请求生成唯一标识符（UUID4），注入到请求状态和响应头中，实现全链路请求追踪
- **继承**: `starlette.middleware.base.BaseHTTPMiddleware`
- **方法**:

#### dispatch(request, call_next)
- **功能**: 中间件的核心调度方法，拦截每个请求并注入 request_id
- **参数**:
  - `request` — `fastapi.Request`，当前 HTTP 请求对象
  - `call_next` — 可调用对象，调用下一个中间件或路由处理器
- **返回值**: `Response` — HTTP 响应对象（已附加 `X-Request-ID` 头）
- **关键逻辑**:
  1. 使用 `uuid.uuid4()` 生成全局唯一请求 ID
  2. 将 request_id 写入 `request.state.request_id`，供后续处理器和日志使用
  3. 调用 `call_next(request)` 执行后续中间件链和路由处理器
  4. 在响应头中添加 `X-Request-ID` 字段，使客户端可以获取请求追踪 ID

### RequestLoggingMiddleware
- **功能**: 记录每个 HTTP 请求的完整信息（方法、路径、状态码、耗时），跳过健康检查端点
- **继承**: `starlette.middleware.base.BaseHTTPMiddleware`
- **方法**:

#### dispatch(request, call_next)
- **功能**: 中间件的核心调度方法，记录请求耗时和结果
- **参数**:
  - `request` — `fastapi.Request`，当前 HTTP 请求对象
  - `call_next` — 可调用对象，调用下一个中间件或路由处理器
- **返回值**: `Response` — HTTP 响应对象（不修改响应内容）
- **关键逻辑**:
  1. 记录请求开始时间 `start_time`（使用 `time.time()`）
  2. 调用 `call_next(request)` 执行后续中间件链，获取响应
  3. 计算耗时（毫秒）：`(time.time() - start_time) * 1000`
  4. 跳过健康检查路径 `/api/health`，避免日志噪音
  5. 使用 structlog 记录结构化日志，包含字段：
     - `method` — HTTP 方法（GET/POST/PUT/DELETE 等）
     - `path` — 请求 URL 路径
     - `status_code` — HTTP 响应状态码
     - `duration_ms` — 请求耗时（毫秒，保留两位小数）
     - `request_id` — 请求唯一标识（从 `request.state.request_id` 获取，若缺失则用 `"unknown"`）

### logger（模块级变量）
- **功能**: 使用 `structlog.get_logger(__name__)` 创建的模块级日志记录器，命名空间为 `m0_infrastructure.middleware`

## 依赖关系
- `time` — 标准库时间模块（计时）
- `uuid` — 标准库 UUID 生成模块
- `fastapi.Request` — FastAPI 请求对象
- `starlette.middleware.base.BaseHTTPMiddleware` — Starlette 中间件基类
- `structlog.get_logger` — 结构化日志记录器

## 注意事项
- `RequestIDMiddleware` 必须在 `RequestLoggingMiddleware` 之前注册，否则日志中 `request_id` 字段将始终为 `"unknown"`
- `RequestLoggingMiddleware` 硬编码跳过了 `/api/health` 路径，如果健康检查路径变更需同步修改
- 两个中间件都继承自 `BaseHTTPMiddleware`，会为每个请求创建协程任务，在高并发场景下需注意性能影响
- `request.state` 是请求级别的存储，请求结束后自动清理，无需手动管理
- 耗时计算使用 `time.time()` 而非 `time.perf_counter()`，在系统时间调整时可能不准确，但对日志场景影响可忽略