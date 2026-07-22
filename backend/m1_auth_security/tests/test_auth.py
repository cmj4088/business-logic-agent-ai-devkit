"""M1 认证端点测试。"""
import os
import shutil
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport


@pytest.fixture(autouse=True)
def setup_env():
    """设置测试环境变量，使用临时数据库。"""
    os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-testing-2024"
    os.environ["FERNET_KEY"] = "Z6k3QMpVX5YHj8cRf2LwNt9Bm4Kd7SvGp1Aq5WsXzE0="
    # 使用临时数据库避免测试间数据污染
    temp_dir = tempfile.mkdtemp()
    os.environ["DATABASE_PATH"] = os.path.join(temp_dir, "test.db")
    # 清除 M0 配置缓存，使其重新读取环境变量
    from m0_infrastructure.config import get_settings as m0_get_settings
    m0_get_settings.cache_clear()
    yield
    # 清理临时数据库
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest_asyncio.fixture
async def client():
    """创建带数据库初始化的测试客户端。"""
    from m0_infrastructure.main import app, lifespan
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client


@pytest.mark.asyncio
async def test_register_validation(client):
    """测试注册输入校验。"""
    # 弱密码应被拒绝
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "123",
        "display_name": "Test",
    })
    assert response.status_code == 422  # Pydantic 校验失败


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """测试无效凭据登录。"""
    response = await client.post("/api/auth/login", json={
        "email": "noexist@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None


@pytest.mark.asyncio
async def test_register_and_login(client):
    """测试完整的注册和登录流程。"""
    # 注册
    response = await client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "testpass123",
        "display_name": "Test User",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["access_token"] is not None
    assert data["data"]["refresh_token"] is not None
    assert data["data"]["token_type"] == "bearer"

    # 登录
    response = await client.post("/api/auth/login", json={
        "email": "newuser@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["access_token"] is not None


@pytest.mark.asyncio
async def test_duplicate_register(client):
    """测试重复注册。"""
    # 第一次注册
    await client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "testpass123",
    })

    # 第二次注册同一邮箱
    response = await client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None
    assert data["error"]["code"] == "CONFLICT_RESOURCE"


@pytest.mark.asyncio
async def test_protected_endpoint(client):
    """测试未认证访问受保护端点。"""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_flow(client):
    """测试完整的认证流程：注册 -> 获取用户信息 -> 登出。"""
    # 注册
    response = await client.post("/api/auth/register", json={
        "email": "flow@example.com",
        "password": "testpass123",
        "display_name": "Flow User",
    })
    data = response.json()
    access_token = data["data"]["access_token"]

    # 获取用户信息
    response = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["email"] == "flow@example.com"
    assert data["data"]["display_name"] == "Flow User"

    # 登出
    response = await client.post("/api/auth/logout", headers={
        "Authorization": f"Bearer {access_token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["message"] == "已登出"


@pytest.mark.asyncio
async def test_api_key_flow(client):
    """测试 API Key 存储、获取、删除流程。"""
    # 注册
    response = await client.post("/api/auth/register", json={
        "email": "apikey@example.com",
        "password": "testpass123",
    })
    data = response.json()
    access_token = data["data"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 存储 API Key
    response = await client.post("/api/auth/api-keys", json={
        "key_name": "anthropic",
        "api_key": "sk-ant-test-key-12345",
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["key_name"] == "anthropic"

    # 获取 API Key
    response = await client.get("/api/auth/api-keys/anthropic", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["exists"] is True

    # 删除 API Key
    response = await client.delete("/api/auth/api-keys/anthropic", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["message"] == "已删除"

    # 再次获取应返回不存在
    response = await client.get("/api/auth/api-keys/anthropic", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None


@pytest.mark.asyncio
async def test_token_refresh(client):
    """测试 Token 刷新。"""
    # 注册
    response = await client.post("/api/auth/register", json={
        "email": "refresh@example.com",
        "password": "testpass123",
    })
    data = response.json()
    refresh_token = data["data"]["refresh_token"]

    # 刷新
    response = await client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["access_token"] is not None
    assert data["data"]["refresh_token"] is not None