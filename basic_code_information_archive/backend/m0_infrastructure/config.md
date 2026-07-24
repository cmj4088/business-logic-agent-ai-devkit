# config.yaml / config.py — M0 配置模块

## config.yaml（后端配置文件）
- **位置**: `backend/config.yaml`
- **作用**: YAML 格式的全局配置，包含 JWT 密钥、数据库路径、LLM 设置等。启动时由 `shared/config.py` 加载，环境变量优先级更高。
- **关键配置**:
  - `jwt_secret` — JWT 签名密钥（HS256），**为空会导致登录 500 错误**
  - `fernet_key` — API Key 加密密钥
  - `database_path` — SQLite 数据库路径
  - `ollama_base_url` / `ollama_default_model` — 本地 LLM 配置
  - `session_token_expire_minutes` — 15 分钟
  - `refresh_token_expire_days` — 30 天
- **注意**: 生产环境必须通过环境变量覆盖密钥！`start_backend.bat` 启动时会检查此文件是否存在。

## config.py — M0 配置模块封装

## 概述
该文件是 M0 基础设施层的配置入口，封装了 `shared.config` 模块中的 `Settings` 配置类。通过 `lru_cache` 缓存机制提供模块级配置单例，供本模块及其它业务模块通过 M0 层统一获取全局配置，避免各模块直接依赖 `shared.config`。

## 函数/类详细说明

### get_settings()
- **功能**: 获取全局配置单例，使用 `lru_cache` 装饰器实现单次实例化后的缓存复用
- **参数**: 无
- **返回值**: `Settings` — shared.config 中定义的全局配置对象
- **关键逻辑**:
  - 使用 `functools.lru_cache()` 装饰器，确保 `Settings` 实例只创建一次，后续调用直接返回缓存
  - 内部委托给 `shared.config.get_settings()` 完成实际创建

## 依赖关系
- `functools.lru_cache` — 标准库缓存装饰器
- `shared.config.Settings` — 全局配置数据类
- `shared.config.get_settings` — 底层配置工厂函数

## 注意事项
- 该文件是 M0 模块对外暴露配置的唯一入口，其他模块应通过 `from m0_infrastructure.config import get_settings` 获取配置
- `lru_cache` 无参数调用等同于 `lru_cache(maxsize=128)`，对于单例场景足够
- 配置变更需要重启应用才能生效，因为缓存不会自动刷新