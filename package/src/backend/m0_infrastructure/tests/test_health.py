"""M0 健康检查端点测试。"""
import pytest
from httpx import AsyncClient, ASGITransport

from m0_infrastructure.main import app


@pytest.mark.asyncio
async def test_health_check():
    """测试健康检查端点返回 200。"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data