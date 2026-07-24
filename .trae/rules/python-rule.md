---
description: Python 后端开发规范 — FastAPI、Pydantic v2、SQLite、模块化
glob: "backend/**/*.py"
---

# Python 后端开发规范

## 技术栈
- **框架**: FastAPI (Python 3.11+)
- **数据校验**: Pydantic v2
- **数据库**: SQLite + aiosqlite（WAL 模式）
- **ORM**: SQLAlchemy async

## 后端模块结构（M0-M10）
| 模块 | 目录 | 职责 |
|------|------|------|
| M0 | `m0_infrastructure/` | FastAPI 应用入口、SQLite WAL 初始化、日志配置 |
| M1 | `m1_auth_security/` | 注册/登录/JWT/API Key 管理 |
| M2 | `m2_workflow_engine/` | IPD 6 阶段推进、门禁投票、活动触发 |
| M3 | `m3_prompt_system/` | Jinja2 模板渲染、上下文构建、注入防护 |
| M4 | `m4_agent_orchestration/` | 3 种编排模式、LLM 降级链、死循环检测 |
| M5 | `m5_artifact_management/` | 18 种产出物 CRUD、版本管理 |
| M6 | `m6_review_system/` | 门禁审核、单人模式自动通过 |
| M7 | `m7_plugin_system/` | 3 个内置插件管理 |
| M8 | `m8_realtime_communication/` | WebSocket 5 通道管理 |
| M9 | `m9_usage_tracking/` | Token 消耗 + 成本统计 |
| M10 | `m10_recovery/` | 4 种异常恢复路径 |

## 代码规范
1. **类型注解**: 完整（mypy strict），Pydantic v2 做数据校验，禁止 `class Config:`（使用 `model_config = SettingsConfigDict(...)`）
2. **数据库**: 所有 SQL 参数化查询，禁止字符串拼接
3. **API**: 遵循统一响应格式 `{data, error, meta}`
4. **安全**: LLM 数据发送前通过 `data_filter.py` 过滤

## 模块规则
1. 模块间通过 API 接口或 service 层调用，禁止跨模块直接导入
2. 所有配置通过 config.py 或环境变量，禁止硬编码
3. 每个模块独立目录，文件不超过 15 个
4. 公开函数必须有 docstring

## 数据安全
1. API Key 等敏感信息 Fernet 加密存储
2. 发送 LLM 的数据仅包含必要上下文
3. Ollama 默认模式数据不出境
4. 日志禁止输出密钥、密码、身份证号、手机号、邮箱

## 错误处理
- 统一 try-catch
- 敏感信息放 config 目录
