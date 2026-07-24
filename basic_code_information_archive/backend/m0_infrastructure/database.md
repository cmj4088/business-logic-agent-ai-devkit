# database.py — 数据库引擎与会话管理

## 概述
该文件是 M0 基础设施层的数据库核心，基于 SQLAlchemy 2.0 异步引擎实现 SQLite 数据库的初始化、连接管理、迁移执行和会话生命周期控制。对外提供 `init_db()`、`close_db()`、`get_db()` 三个核心接口，供 FastAPI 依赖注入和应用生命周期使用。

## 函数/类详细说明

### _engine（模块级全局变量）
- **功能**: 存储 SQLAlchemy 异步引擎实例，初始为 `None`，由 `init_db()` 赋值
- **类型**: `sqlalchemy.ext.asyncio.AsyncEngine | None`

### _session_factory（模块级全局变量）
- **功能**: 存储异步会话工厂，初始为 `None`，由 `init_db()` 赋值
- **类型**: `async_sessionmaker[AsyncSession] | None`

### init_db(settings)
- **功能**: 初始化数据库引擎和连接池，配置 SQLite WAL 模式，并执行迁移脚本
- **参数**:
  - `settings` — 配置对象，需包含 `database_path`（数据库文件路径）和 `debug`（是否开启 SQL 回显）属性
- **返回值**: 无（`None`），通过修改模块级全局变量 `_engine` 和 `_session_factory` 产生副作用
- **关键逻辑**:
  1. 从 `settings.database_path` 获取数据库文件路径，自动创建父目录（如 `data/`）
  2. 构建 SQLite+aiosqlite 异步连接 URL
  3. 创建 `AsyncEngine`，设置 `check_same_thread=False` 以支持多线程访问
  4. 创建 `async_sessionmaker` 会话工厂，`expire_on_commit=False` 避免提交后属性过期
  5. 执行 WAL 模式相关 PRAGMA 配置：
     - `journal_mode=WAL` — 启用 Write-Ahead Logging，提升并发读写性能
     - `synchronous=NORMAL` — 平衡安全性与性能
     - `busy_timeout=5000` — 数据库锁等待超时 5 秒
     - `foreign_keys=ON` — 启用外键约束
     - `cache_size=-8000` — 设置 8MB 缓存（负值表示 KB）
  6. 调用 `_run_migrations()` 执行迁移

### _run_migrations()
- **功能**: 扫描 `migrations/` 目录下的 `.sql` 文件，按文件名排序依次执行未运行的迁移脚本
- **参数**: 无
- **返回值**: 无（`None`）
- **关键逻辑**:
  1. 检查 `migrations/` 目录是否存在，不存在则跳过
  2. 创建 `_migrations` 元数据表记录已执行的迁移文件名和时间戳
  3. 按字母序排序所有 `.sql` 文件，逐一检查是否已在 `_migrations` 表中存在
  4. 对未执行的迁移：读取 SQL 内容，按 `;` 分割为多条语句，逐条执行
  5. 执行成功后向 `_migrations` 表插入记录，防止重复执行
- **注意**: 该函数是模块内部函数（以 `_` 前缀命名），不对外暴露

### close_db()
- **功能**: 关闭数据库引擎，释放连接池资源
- **参数**: 无
- **返回值**: 无（`None`）
- **关键逻辑**: 调用 `_engine.dispose()` 关闭引擎，并将 `_engine` 重置为 `None`

### get_db()
- **功能**: 异步生成器函数，为 FastAPI 依赖注入提供数据库会话
- **参数**: 无
- **返回值**: `AsyncGenerator[AsyncSession, None]` — 异步生成器，yield SQLAlchemy 异步会话对象
- **关键逻辑**:
  1. 检查 `_session_factory` 是否已初始化，未初始化则抛出 `RuntimeError`
  2. 使用 `async with` 上下文管理器创建会话，确保会话在请求结束后自动关闭
  3. `finally` 块中显式调用 `session.close()` 确保资源释放

## 依赖关系
- `sqlalchemy.ext.asyncio` — `create_async_engine`、`AsyncSession`、`async_sessionmaker`
- `sqlalchemy.text` — 用于执行原始 SQL 语句
- `m0_infrastructure.config.get_settings` — 获取数据库路径配置
- `os` — 文件系统操作（目录创建、文件遍历）

## 注意事项
- 必须在应用启动时（`lifespan` startup 阶段）调用 `init_db()`，否则 `get_db()` 会抛出 `RuntimeError`
- SQLite 数据库文件路径由 `settings.database_path` 配置决定，默认数据目录为 `data/`
- 迁移文件放在 `m0_infrastructure/migrations/` 目录下，以 `.sql` 扩展名命名，按文件名字母序执行
- 迁移是不可逆的 — 一旦执行，`_migrations` 表会阻止重复执行，没有回滚机制
- `get_db()` 是异步生成器，只能通过 FastAPI 的 `Depends()` 注入使用，不能直接 `await` 调用