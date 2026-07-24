# 基础设施模块 代码说明

## 文件: main.py
- **路径**: `backend/m0_infrastructure/main.py`
- **作用**: FastAPI 应用入口，负责应用实例创建、生命周期管理、中间件注册、全局异常处理、路由注册和生产模式前端静态文件托管
- **关键函数/类**:
  - `lifespan(app)`: 异步上下文管理器，管理 FastAPI 应用启动（日志初始化/数据库初始化/迁移执行）和关闭（数据库连接清理）
  - `create_app()`: 工厂函数，创建并配置完整的 FastAPI 应用实例，注册所有中间件、异常处理器和 M1-M10 模块路由，最后尝试挂载前端静态文件
  - `_mount_frontend_static(app)`: 检测 `frontend/dist` 目录是否存在，存在则挂载为 SPA 静态文件服务（生产模式自托管前端），所有未匹配到 API 的路径回退到 index.html
  - `SPAStaticFiles`: 继承自 `StaticFiles`，支持 SPA 路由（404 时回退到 index.html）
  - `get_settings()`: 获取全局配置对象，注入到 `app.state.settings`
  - `health_check()`: `GET /api/health` 健康检查端点
  - `app`: 模块级变量 `create_app()` 的直接结果，供 uvicorn 导入
- **依赖关系**:
  - 引入: `m0_infrastructure.logging_config`, `m0_infrastructure.database`, `shared.config`, `m0_infrastructure.middleware`, 各模块 router（m1-m10）
  - 被引用: uvicorn 启动命令 `python -m m0_infrastructure.main`
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建，集成 M1-M10 所有模块路由

## 文件: database.py
- **路径**: `backend/m0_infrastructure/database.py`
- **作用**: SQLite 数据库初始化、WAL 模式配置、异步会话管理、迁移执行引擎
- **关键函数/类**:
  - `init_db(settings)`: 初始化数据库引擎，配置 WAL 模式与连接池，执行待迁移
  - `close_db()`: 关闭数据库引擎，释放连接
  - `get_db()`: 异步生成器，提供 FastAPI `Depends` 依赖注入的数据库会话
  - `run_migrations(conn, settings)`: 执行 `migrations/` 目录下所有未执行的 SQL 迁移文件
  - `_get_applied_migrations(conn)`: 查询已执行的迁移记录
- **依赖关系**:
  - 引入: `sqlalchemy.ext.asyncio`, `shared.config`, `migrations/` 目录下的 SQL 文件
  - 被引用: 所有模块的 router.py（通过 `Depends(get_db)`），`main.py`（通过 `init_db/close_db`）
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建，支持 v001-v006 六个数据库迁移

## 文件: config.py
- **路径**: `backend/m0_infrastructure/config.py`
- **作用**: 管理所有系统配置项，从 config.yaml 和环境变量中加载
- **关键函数/类**:
  - `Settings`: Pydantic BaseSettings 类，定义所有配置字段（数据库路径、JWT 密钥、Fernet 密钥、LLM 配置等）
  - `get_settings()`: 单例模式获取 Settings 实例
- **依赖关系**:
  - 引入: `pydantic-settings`, `pyyaml`
  - 被引用: 全局各模块通过 `from shared.config import get_settings` 引用
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建

## 文件: middleware.py
- **路径**: `backend/m0_infrastructure/middleware.py`
- **作用**: 注册 FastAPI 中间件（CORS、请求日志、统一错误格式）
- **关键函数/类**:
  - `setup_middleware(app)`: 注册 CORS 中间件（允许本地开发跨域）、请求日志中间件、统一异常处理中间件
- **依赖关系**:
  - 引入: `fastapi.middleware.cors`, `starlette.middleware`
  - 被引用: `main.py` 的 `create_app()` 调用
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建

## 文件: logging_config.py
- **路径**: `backend/m0_infrastructure/logging_config.py`
- **作用**: 配置结构化日志系统（structlog），区分控制台和文件输出
- **依赖关系**:
  - 引入: `structlog`, `logging`, `datetime`
  - 被引用: `main.py` 的 `lifespan()` 中 `setup_logging()` 调用
- **最后修改**: 2026-07-09
- **修改原因**: 项目初始化时创建

## 文件: settings_router.py
- **路径**: `backend/m0_infrastructure/router.py`
- **作用**: 提供系统设置相关的 API 端点（获取/更新配置）
- **依赖关系**:
  - 引入: `fastapi.APIRouter`, `m0_infrastructure.database`
  - 被引用: `main.py` 中 `app.include_router` 注册
- **最后修改**: 2026-07-09
- **修改原因**: 后续新增的设置管理端点
