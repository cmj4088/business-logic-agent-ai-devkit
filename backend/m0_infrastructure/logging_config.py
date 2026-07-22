"""结构化日志配置 — M0 基础设施。

配置 structlog，输出 JSON 格式到 stdout，同时写入文件。
"""
import structlog
import logging
import os
from logging.handlers import RotatingFileHandler

from .config import get_settings


def setup_logging() -> None:
    """初始化 structlog 结构化日志系统。"""
    settings = get_settings()

    # 清除默认处理器
    structlog.reset_defaults()

    # 配置标准库 logging（供 structlog 和第三方库使用）
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # 共享处理器
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    # 控制台输出（JSON 格式）
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    structlog.configure(
        processors=processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # 配置 formatter
    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
    )
    console_handler.setFormatter(formatter)

    # 根 logger 配置
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)

    # 文件日志（如有配置）
    if settings.log_file:
        os.makedirs(os.path.dirname(settings.log_file), exist_ok=True)
        file_handler = RotatingFileHandler(
            settings.log_file,
            maxBytes=settings.log_max_bytes,
            backupCount=settings.log_backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)