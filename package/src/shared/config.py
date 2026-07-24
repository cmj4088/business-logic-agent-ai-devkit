"""配置加载模块。

从 YAML 配置文件和环境变量中加载应用程序配置，
支持环境变量覆盖 YAML 配置值。
"""

import os
from pathlib import Path
from typing import Any, Optional

import yaml
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置（环境变量优先级 > config.yaml > 默认值）。

    所有配置项均可通过环境变量或 .env 文件进行覆盖。
    """

    # 应用
    app_name: str = "Business Logic Agent"
    app_version: str = "0.1.0"
    debug: bool = False
    cors_origins: str = "http://localhost:5173,http://localhost:5174,app://."

    # 数据库
    database_path: str = "data/ipd_agent.db"

    # JWT
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    session_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # 加密
    fernet_key: str = ""

    # 日志
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    log_max_bytes: int = 10 * 1024 * 1024  # 10MB
    log_backup_count: int = 5

    # LLM
    llm_default: str = "ollama"
    llm_timeout: int = 300
    llm_max_retries: int = 3
    llm_circuit_breaker_max_failures: int = 5
    llm_circuit_breaker_retry_minutes: int = 10
    llm_format_retry_max: int = 2

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_default_model: str = "qwen2.5"

    # 工作流
    max_rollback_count: int = 2
    stage_timeout_hours: int = 72

    # 用量限制
    default_daily_token_limit: int = 100000
    default_monthly_token_limit: int = 2000000
    budget_warning_threshold: float = 0.8  # 80%

    # 附件
    max_attachment_size_mb: int = 50

    # WebSocket
    ws_heartbeat_interval: int = 30
    ws_max_reconnect_attempts: int = 5
    ws_max_connections: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


def load_yaml_config(config_path: str = "config.yaml") -> dict[str, Any]:
    """加载 YAML 配置文件。

    Args:
        config_path: YAML 配置文件的路径，默认为 "config.yaml"。

    Returns:
        解析后的配置字典，如果文件不存在则返回空字典。
    """
    path = Path(config_path)
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def get_settings(config_path: str = "config.yaml") -> Settings:
    """获取配置实例（合并环境变量和 YAML）。

    先加载 YAML 配置文件，再将其扁平化映射到环境变量，
    最后通过 pydantic-settings 创建 Settings 实例。
    环境变量中的值优先级高于 YAML 中的值。

    Args:
        config_path: YAML 配置文件的路径，默认为 "config.yaml"。

    Returns:
        合并后的 Settings 配置实例。
    """
    yaml_config = load_yaml_config(config_path)
    # 将 YAML 配置扁平化映射到环境变量
    _flatten_yaml_to_env(yaml_config)
    return Settings()


def _flatten_yaml_to_env(config: dict[str, Any], prefix: str = "") -> None:
    """将嵌套 YAML 配置扁平化设置到环境变量。

    递归遍历配置字典，将嵌套键值对转换为大写环境变量名。
    只有当环境变量不存在时才会设置，因此环境变量优先级更高。

    Args:
        config: 嵌套的配置字典。
        prefix: 用于构建环境变量名的前缀。
    """
    for key, value in config.items():
        env_key = f"{prefix}{key}".upper() if prefix else key.upper()
        if isinstance(value, dict):
            _flatten_yaml_to_env(value, f"{key}_")
        elif value is not None and env_key not in os.environ:
            os.environ[env_key] = str(value)