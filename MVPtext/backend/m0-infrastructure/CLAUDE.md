# M0: 基础设施 — CLAUDE.md

> **模块编号**：M0
> **模块名称**：基础设施
> **负责 Agent**：后端开发 A
> **开发周期**：Week 1-2
> **上游依赖**：无
> **下游被依赖**：M1, M2, M3, M4, M5, M6, M7, M8, M9, M10（所有后端模块）

---

## 职责范围

M0 是整个系统的基石，负责：
1. **项目骨架**：FastAPI 应用初始化、路由注册、中间件注册
2. **数据库初始化**：SQLite 连接池、WAL 模式配置、建表迁移
3. **配置管理**：从 `config.yaml` + 环境变量加载所有配置
4. **日志系统**：structlog 结构化日志初始化
5. **健康检查**：`GET /api/health` 端点（Electron 启动时轮询）
6. **应用生命周期**：startup/shutdown 事件处理

---

## 输入依赖

- **无**（M0 是最底层模块，不依赖其他业务模块）
- 依赖的外部库：FastAPI、SQLAlchemy、structlog、PyYAML

---

## 输出接口

M0 为其他模块提供：

| 接口 | 说明 |
|------|------|
| `app: FastAPI` | FastAPI 应用实例（其他模块注册 router） |
| `get_db() -> AsyncSession` | 数据库会话依赖注入 |
| `settings: Settings` | 全局配置对象（Pydantic Settings） |
| `logger: structlog.BoundLogger` | 结构化日志实例 |
| `GET /api/health` | 健康检查端点 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `main.py` | FastAPI 应用入口、startup/shutdown 事件 |
| `config.py` | 配置加载（Pydantic Settings + config.yaml） |
| `database.py` | 数据库引擎、会话工厂、WAL 配置 |
| `middleware.py` | 全局中间件（CORS、请求日志、request_id） |
| `logging_config.py` | structlog 配置 |
| `migrations/` | SQL 迁移脚本目录 |
| `migrations/v001_init.sql` | 初始建表（17 张表，按 database-schema-v3.md） |

---

## 完成标准

- [ ] FastAPI 应用启动成功，`GET /api/health` 返回 200
- [ ] SQLite 数据库文件创建，WAL 模式生效（`PRAGMA journal_mode` 返回 `wal`）
- [ ] 17 张表全部创建成功
- [ ] 结构化日志输出到 stdout（JSON 格式）和文件
- [ ] 配置文件加载正确（环境变量优先级 > config.yaml > 默认值）
- [ ] Electron 能成功启动 Python 子进程并检测健康检查

---

## 禁止事项

1. **禁止使用 SQLite 默认 rollback 模式**（必须配置 WAL）
2. **禁止在 startup 事件中执行耗时操作**（阻塞应用启动）
3. **禁止在日志中输出敏感信息**（密码、密钥、Token）
4. **禁止硬编码数据库路径**（必须从配置读取）
5. **禁止跨模块导入**（M0 不导入其他业务模块）
6. **禁止使用 print() 代替 structlog**
