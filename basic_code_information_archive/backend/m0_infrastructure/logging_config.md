# logging_config.py — 结构化日志配置

## 概述
该文件是 M0 基础设施层的日志系统配置模块，基于 `structlog` 库搭建结构化日志系统。日志以 JSON 格式输出到控制台（stdout），同时可选地写入文件（支持日志轮转）。配置完成后，整个应用可通过 `structlog.get_logger()` 获取结构化日志记录器。

## 函数/类详细说明

### setup_logging()
- **功能**: 初始化 structlog 结构化日志系统，配置处理器链、格式化器和输出目标
- **参数**: 无（内部通过 `get_settings()` 获取配置）
- **返回值**: 无（`None`），通过修改全局 `structlog` 配置和标准库 `logging` 根 logger 产生副作用
- **关键逻辑**:
  1. **重置默认配置**: 调用 `structlog.reset_defaults()` 清除之前可能存在的配置
  2. **日志级别映射**: 从 `settings.log_level` 读取字符串（如 `"INFO"`），通过 `getattr(logging, ...)` 转换为标准库日志级别常量，默认 `logging.INFO`
  3. **处理器链配置**（按顺序）:
     - `filter_by_level` — 按级别过滤日志记录
     - `add_logger_name` — 添加 logger 名称
     - `add_log_level` — 添加日志级别
     - `PositionalArgumentsFormatter()` — 格式化位置参数（`%s` 风格）
     - `TimeStamper(fmt="iso")` — 添加 ISO 8601 格式时间戳
     - `StackInfoRenderer()` — 渲染堆栈信息
     - `format_exc_info` — 格式化异常信息
     - `UnicodeDecoder()` — 解码 Unicode 字符
  4. **structlog 全局配置**:
     - `processors` — 在基础处理器链后追加 `wrap_for_formatter`
     - `context_class=dict` — 使用普通字典作为上下文容器
     - `logger_factory=stdlib.LoggerFactory()` — 使用标准库 logging 作为底层
     - `wrapper_class=stdlib.BoundLogger` — 返回绑定日志器
     - `cache_logger_on_first_use=True` — 首次使用后缓存 logger
  5. **JSON 格式化器**: 使用 `structlog.processors.JSONRenderer()` 将日志渲染为 JSON 字符串
  6. **控制台输出**: 创建 `StreamHandler` 输出到 stdout，设置格式化器
  7. **文件输出**（可选）: 如果 `settings.log_file` 已配置，创建 `RotatingFileHandler`：
     - `maxBytes` — 单个日志文件最大字节数
     - `backupCount` — 保留的备份文件数量
     - `encoding="utf-8"` — 使用 UTF-8 编码
  8. 将处理器添加到根 logger，使所有模块的日志都能被捕获

## 依赖关系
- `structlog` — 结构化日志库（核心依赖）
- `logging` — Python 标准库日志模块
- `logging.handlers.RotatingFileHandler` — 日志文件轮转处理器
- `os` — 文件系统操作（创建日志目录）
- `m0_infrastructure.config.get_settings` — 获取日志配置

## 注意事项
- 该函数应在应用启动最早期调用（在 `lifespan` startup 中第一个调用），确保后续所有日志都能被正确捕获
- 日志输出为 JSON 格式，适合日志收集系统（如 ELK、Loki）解析
- 文件日志轮转使用 `RotatingFileHandler`，按文件大小触发，不会按时间轮转
- 如果 `settings.log_file` 为空或未配置，文件日志不会启用，仅控制台输出
- 日志处理器链的顺序很重要：`filter_by_level` 必须在最前面，`JSONRenderer` 在最后