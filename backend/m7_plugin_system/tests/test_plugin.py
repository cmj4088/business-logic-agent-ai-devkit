"""M7 插件端点测试。"""
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
    temp_dir = tempfile.mkdtemp()
    os.environ["DATABASE_PATH"] = os.path.join(temp_dir, "test.db")
    from m0_infrastructure.config import get_settings as m0_get_settings
    m0_get_settings.cache_clear()
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest_asyncio.fixture
async def client():
    """创建带数据库初始化的测试客户端。"""
    from m0_infrastructure.main import app, lifespan
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client


async def _register_and_get_token(client: AsyncClient) -> str:
    """辅助函数：注册用户并返回 access_token。"""
    response = await client.post("/api/auth/register", json={
        "email": "plugin_test@example.com",
        "password": "testpass123",
        "display_name": "Plugin Tester",
    })
    data = response.json()
    return data["data"]["access_token"]


@pytest.mark.asyncio
async def test_list_plugins_empty(client):
    """测试初始状态下已安装插件列表为空。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/plugins", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"] == []


@pytest.mark.asyncio
async def test_get_available_plugins(client):
    """测试获取可用插件市场列表。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/plugins/available", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert len(data["data"]) >= 1
    # 在返回的插件列表中找到 web_search 插件
    web_search = next((p for p in data["data"] if p["plugin_id"] == "web_search"), None)
    assert web_search is not None, "web_search 插件应在可用插件列表中"
    assert web_search["name"] == "网页搜索"
    assert web_search["installed"] is False
    assert "config_schema" in web_search
    assert len(web_search["tools"]) == 2


@pytest.mark.asyncio
async def test_install_web_search_plugin(client):
    """测试安装 web_search 插件。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装插件
    response = await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {"search_engine": "duckduckgo", "max_results": 10},
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    plugin = data["data"]
    assert plugin["plugin_id"] == "web_search"
    assert plugin["name"] == "网页搜索"
    assert plugin["enabled"] is True
    assert plugin["config"]["search_engine"] == "duckduckgo"
    assert plugin["config"]["max_results"] == 10
    assert len(plugin["tools"]) == 2

    # 验证已安装列表包含该插件
    response = await client.get("/api/plugins", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["plugin_id"] == "web_search"

    # 验证可用市场标记为已安装
    response = await client.get("/api/plugins/available", headers=headers)
    data = response.json()
    web_search = next((p for p in data["data"] if p["plugin_id"] == "web_search"), None)
    assert web_search is not None
    assert web_search["installed"] is True


@pytest.mark.asyncio
async def test_install_duplicate_plugin(client):
    """测试重复安装同一插件应返回冲突错误。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 第一次安装
    await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {},
    }, headers=headers)

    # 第二次安装
    response = await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {},
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None
    assert data["error"]["code"] == "CONFLICT_RESOURCE"


@pytest.mark.asyncio
async def test_install_nonexistent_plugin(client):
    """测试安装不存在的插件应返回 404。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post("/api/plugins/install", json={
        "plugin_id": "nonexistent_plugin",
        "config": {},
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is not None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_get_plugin_detail(client):
    """测试获取插件详情。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装
    await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {"search_engine": "duckduckgo"},
    }, headers=headers)

    # 获取详情
    response = await client.get("/api/plugins/web_search", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    plugin = data["data"]
    assert plugin["plugin_id"] == "web_search"
    assert plugin["name"] == "网页搜索"
    assert plugin["version"] == "1.0.0"
    assert "tools" in plugin
    assert len(plugin["tools"]) == 2

    # 获取不存在的插件
    response = await client.get("/api/plugins/nonexistent", headers=headers)
    data = response.json()
    assert data["error"] is not None
    assert data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_toggle_plugin(client):
    """测试启用/禁用插件。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装
    await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {},
    }, headers=headers)

    # 禁用
    response = await client.post("/api/plugins/web_search/toggle", json={
        "enabled": False,
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["enabled"] is False

    # 重新启用
    response = await client.post("/api/plugins/web_search/toggle", json={
        "enabled": True,
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["enabled"] is True


@pytest.mark.asyncio
async def test_update_plugin_config(client):
    """测试更新插件配置。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装
    await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {"search_engine": "duckduckgo", "max_results": 5},
    }, headers=headers)

    # 更新配置
    response = await client.put("/api/plugins/web_search", json={
        "config": {"max_results": 15, "timeout": 30},
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    plugin = data["data"]
    assert plugin["config"]["max_results"] == 15
    assert plugin["config"]["timeout"] == 30
    assert plugin["config"]["search_engine"] == "duckduckgo"  # 保留原有配置


@pytest.mark.asyncio
async def test_uninstall_plugin(client):
    """测试卸载插件。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装
    await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {},
    }, headers=headers)

    # 卸载
    response = await client.delete("/api/plugins/web_search", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["message"] == "插件已卸载"

    # 验证已卸载
    response = await client.get("/api/plugins", headers=headers)
    data = response.json()
    assert data["data"] == []

    # 验证工具已清除
    response = await client.get("/api/plugins/web_search", headers=headers)
    data = response.json()
    assert data["error"] is not None


@pytest.mark.asyncio
async def test_unauthenticated_access(client):
    """测试未认证访问插件端点应返回 401。"""
    # 不携带 token 访问
    response = await client.get("/api/plugins")
    assert response.status_code == 401

    response = await client.get("/api/plugins/available")
    assert response.status_code == 401

    response = await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {},
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_plugin_api_key_encryption(client):
    """测试插件 API Key 加密存储。"""
    token = await _register_and_get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 安装时传入 API Key
    response = await client.post("/api/plugins/install", json={
        "plugin_id": "web_search",
        "config": {
            "search_engine": "serpapi",
            "search_api_key": "test-serpapi-key-12345",
        },
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None

    # 返回的 API Key 应该脱敏
    plugin = data["data"]
    assert plugin["config"]["search_api_key"] == "***"

    # 获取详情时 API Key 也应脱敏
    response = await client.get("/api/plugins/web_search", headers=headers)
    data = response.json()
    assert data["data"]["config"]["search_api_key"] == "***"