"""M0 配置模块 — 封装 shared.config 的 Settings。

提供模块级配置单例，供其他模块通过 M0 获取配置。
"""
from functools import lru_cache
from shared.config import Settings, get_settings as _get_settings


@lru_cache()
def get_settings() -> Settings:
    """获取全局配置单例（带缓存）。"""
    return _get_settings()