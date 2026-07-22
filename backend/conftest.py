"""Backend 全局 pytest 配置。"""
import pytest
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环供异步测试使用。"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()