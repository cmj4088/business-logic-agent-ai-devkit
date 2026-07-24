"""BLA 云服务器启动脚本。

在 Docker 容器首次启动时自动生成 JWT 密钥和配置，
然后启动 FastAPI 服务。
"""
import os
import secrets
from pathlib import Path

import yaml

CONFIG_PATH = Path("/app/backend/config.yaml")


def generate_config():
    """生成默认配置（仅首次运行）。"""
    if CONFIG_PATH.exists():
        return

    from cryptography.fernet import Fernet

    config = {
        "app_name": "Business Logic Agent",
        "app_version": "1.0.0",
        "debug": False,
        "jwt_secret": secrets.token_hex(32),
        "jwt_algorithm": "HS256",
        "session_token_expire_minutes": 60,
        "refresh_token_expire_days": 30,
        "fernet_key": Fernet.generate_key().decode(),
        "llm_default": os.getenv("LLM_DEFAULT", "ollama"),
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "ollama_default_model": os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5"),
        "database_path": "/app/data/ipd_agent.db",
        "log_level": "INFO",
    }

    with open(CONFIG_PATH, "w") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)

    print("[Startup] Config file generated")


if __name__ == "__main__":
    generate_config()
    print("[Startup] Starting BLA server...")
    import uvicorn

    uvicorn.run(
        "m0_infrastructure.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
