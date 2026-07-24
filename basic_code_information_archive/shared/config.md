# config.py — 配置加载模块

## 概述
该文件负责从 **YAML 配置文件**和**环境变量**中加载应用程序配置。使用 `pydantic-settings` 的 `BaseSettings` 实现类型安全的配置管理，支持环境变量自动覆盖 YAML 配置值。环境变量优先级高于配置文件。

## 类详细说明

### Settings（继承 BaseSettings）
全局配置类，包含以下配置项分组：

#### 应用配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `app_name` | `str` | `"Business Logic Agent"` | 应用名称 |
| `app_version` | `str` | `"0.1.0"` | 应用版本号 |
| `debug` | `bool` | `False` | 调试模式开关 |

#### 数据库配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `database_path` | `str` | `"data/ipd_agent.db"` | SQLite 数据库文件路径 |

#### JWT 认证配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `jwt_secret` | `str` | `""` | JWT 签名密钥（生产环境必须设置） |
| `jwt_algorithm` | `str` | `"HS256"` | JWT 签名算法 |
| `session_token_expire_minutes` | `int` | `15` | 会话令牌过期时间（分钟） |
| `refresh_token_expire_days` | `int` | `30` | 刷新令牌过期时间（天） |

#### 加密配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fernet_key` | `str` | `""` | Fernet 对称加密密钥 |

#### 日志配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `log_level` | `str` | `"INFO"` | 日志级别 |
| `log_file` | `str` | `"logs/app.log"` | 日志文件路径 |
| `log_max_bytes` | `int` | `10485760`（10MB） | 单个日志文件最大大小 |
| `log_backup_count` | `int` | `5` | 日志备份文件数量 |

#### LLM 配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `llm_default` | `str` | `"ollama"` | 默认 LLM 提供商 |
| `llm_timeout` | `int` | `300` | LLM 请求超时（秒） |
| `llm_max_retries` | `int` | `3` | LLM 最大重试次数 |
| `llm_circuit_breaker_max_failures` | `int` | `5` | 熔断器最大失败次数 |
| `llm_circuit_breaker_retry_minutes` | `int` | `10` | 熔断后重试间隔（分钟） |
| `llm_format_retry_max` | `int` | `2` | 格式校验最大重试次数 |

#### Ollama 配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ollama_base_url` | `str` | `"http://localhost:11434"` | Ollama 服务地址 |
| `ollama_default_model` | `str` | `"qwen2.5"` | 默认 Ollama 模型 |

#### 工作流配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_rollback_count` | `int` | `2` | 最大回滚次数 |
| `stage_timeout_hours` | `int` | `72` | 阶段超时时间（小时） |

#### 用量限制配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `default_daily_token_limit` | `int` | `100000` | 默认每日 Token 限制 |
| `default_monthly_token_limit` | `int` | `2000000` | 默认每月 Token 限制 |
| `budget_warning_threshold` | `float` | `0.8` | 预算警告阈值（80%） |

#### 附件配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_attachment_size_mb` | `int` | `50` | 最大附件大小（MB） |

#### WebSocket 配置
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ws_heartbeat_interval` | `int` | `30` | 心跳间隔（秒） |
| `ws_max_reconnect_attempts` | `int` | `5` | 最大重连次数 |
| `ws_max_connections` | `int` | `10` | 最大连接数 |

#### 内部配置
- **Config.env_file**: `".env"` — 环境变量文件路径
- **Config.env_file_encoding**: `"utf-8"` — 环境变量文件编码

## 函数详细说明

### load_yaml_config(config_path)
- **功能**: 加载 YAML 配置文件
- **参数**: `config_path: str` — 配置文件路径，默认 `"config.yaml"`
- **返回值**: `dict[str, Any]` — 解析后的配置字典，文件不存在返回空字典
- **关键逻辑**: 使用 `yaml.safe_load()` 安全加载（避免执行任意 Python 代码）

### get_settings(config_path)
- **功能**: 获取配置实例（合并环境变量和 YAML）
- **参数**: `config_path: str` — 配置文件路径，默认 `"config.yaml"`
- **返回值**: `Settings` — 合并后的配置实例
- **关键逻辑**:
  1. 先加载 YAML 配置文件
  2. 将 YAML 配置扁平化映射到环境变量
  3. 通过 `Settings()` 创建实例（pydantic-settings 自动读取环境变量）

### _flatten_yaml_to_env(config, prefix)（内部函数）
- **功能**: 将嵌套 YAML 配置扁平化映射到环境变量
- **参数**:
  - `config: dict[str, Any]` — 嵌套的配置字典
  - `prefix: str` — 环境变量名前缀
- **关键逻辑**:
  - 递归遍历配置字典
  - 将嵌套键值对转换为大写环境变量名（如 `llm.timeout` → `LLM_TIMEOUT`）
  - 只有当环境变量不存在时才设置，确保环境变量优先级更高
  - 值为 None 的键不设置到环境变量

## 配置优先级

从高到低：
1. 环境变量（如 `export DEBUG=true`）
2. `.env` 文件
3. `config.yaml` 配置文件
4. Settings 类中的默认值

## 依赖关系
- `os` — 环境变量操作
- `pathlib.Path` — 文件路径处理
- `typing` — 类型注解
- `yaml` — YAML 文件解析
- `pydantic_settings.BaseSettings` — 类型安全的配置管理

## 注意事项
- `jwt_secret` 和 `fernet_key` 默认值为空字符串，生产环境必须通过环境变量设置
- 环境变量名必须与 Settings 字段名一致（大写）才能自动映射
- YAML 中的嵌套配置会被扁平化（如 `llm: { timeout: 300 }` → `LLM_TIMEOUT=300`）
- 扁平化时，嵌套层的值如果不是字典，则直接设置到环境变量
- 值为 None 的键不会覆盖环境变量