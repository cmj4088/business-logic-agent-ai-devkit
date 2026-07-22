"""M9 用量追踪测试。"""
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


@pytest_asyncio.fixture
async def auth_client(client):
    """创建已认证的客户端，并创建一个测试项目。"""
    # 注册用户
    response = await client.post("/api/auth/register", json={
        "email": "usage_test@example.com",
        "password": "testpass123",
        "display_name": "Usage Tester",
    })
    data = response.json()
    token = data["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers, token


async def _create_project(client, headers, name="测试项目", budget_limit=10.0):
    """辅助函数：创建测试项目。"""
    # 直接插入项目
    import uuid
    from datetime import datetime, timezone
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    from m0_infrastructure.database import _engine
    from sqlalchemy import text
    async with _engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO projects (id, user_id, name, budget_limit, template_id, created_at, updated_at)
                VALUES (:id, :user_id, :name, :budget_limit, :template_id, :created_at, :updated_at)
            """),
            {
                "id": project_id,
                "user_id": "test-user-id",
                "name": name,
                "budget_limit": budget_limit,
                "template_id": "test-template",
                "created_at": now,
                "updated_at": now,
            }
        )
        # 插入用量记录
        await conn.execute(
            text("""
                INSERT INTO usage_records (id, project_id, model, input_tokens, output_tokens, cost_usd, created_at)
                VALUES (:id, :project_id, :model, :input_tokens, :output_tokens, :cost_usd, :created_at)
            """),
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "model": "ollama",
                "input_tokens": 500,
                "output_tokens": 300,
                "cost_usd": 0.0,
                "created_at": now,
            }
        )
        await conn.execute(
            text("""
                INSERT INTO usage_records (id, project_id, model, input_tokens, output_tokens, cost_usd, created_at)
                VALUES (:id, :project_id, :model, :input_tokens, :output_tokens, :cost_usd, :created_at)
            """),
            {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "model": "claude-sonnet-4-5",
                "input_tokens": 1000,
                "output_tokens": 500,
                "cost_usd": 0.0105,
                "created_at": now,
            }
        )
    return project_id


# ===== 测试用例 =====


@pytest.mark.asyncio
async def test_get_project_usage_empty(auth_client):
    """测试获取不存在项目的用量统计。"""
    client, headers, _ = auth_client
    response = await client.get("/api/usage/projects/nonexistent-id", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["data"]["total_tokens"] == 0
    assert data["data"]["total_cost"] == 0.0
    assert data["data"]["by_model"] == []


@pytest.mark.asyncio
async def test_get_project_usage_with_data(auth_client):
    """测试获取有用量记录的项目的统计。"""
    client, headers, _ = auth_client
    project_id = await _create_project(client, headers)

    response = await client.get(f"/api/usage/projects/{project_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    usage = data["data"]
    assert usage["project_id"] == project_id
    assert usage["total_tokens"] == 2300  # 500+300 + 1000+500
    assert usage["total_input_tokens"] == 1500
    assert usage["total_output_tokens"] == 800
    assert usage["total_cost"] == 0.0105
    assert usage["record_count"] == 2
    assert len(usage["by_model"]) == 2

    # 验证按模型分布
    models = {m["model"]: m for m in usage["by_model"]}
    assert "ollama" in models
    assert "claude-sonnet-4-5" in models
    # Ollama 成本应为 0
    assert models["ollama"]["cost"] == 0.0
    assert models["ollama"]["tokens"] == 800
    # Claude Sonnet 有成本
    assert models["claude-sonnet-4-5"]["tokens"] == 1500
    assert models["claude-sonnet-4-5"]["cost"] == 0.0105


@pytest.mark.asyncio
async def test_get_summary(auth_client):
    """测试全局用量摘要。"""
    client, headers, _ = auth_client
    await _create_project(client, headers)

    response = await client.get("/api/usage/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    summary = data["data"]
    assert summary["total_tokens"] > 0
    assert summary["total_records"] > 0
    assert summary["active_projects"] > 0
    assert "total_cost" in summary
    assert "total_input_tokens" in summary
    assert "total_output_tokens" in summary


@pytest.mark.asyncio
async def test_get_daily_trend(auth_client):
    """测试每日用量趋势。"""
    client, headers, _ = auth_client
    await _create_project(client, headers)

    response = await client.get("/api/usage/daily", headers=headers, params={"days": 30})
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    trend = data["data"]
    assert isinstance(trend, list)
    # 今天应该有数据
    assert len(trend) > 0


@pytest.mark.asyncio
async def test_get_daily_trend_default_days(auth_client):
    """测试每日趋势默认天数参数。"""
    client, headers, _ = auth_client
    response = await client.get("/api/usage/daily", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None


@pytest.mark.asyncio
async def test_limits_crud(auth_client):
    """测试用量限制的获取和更新。"""
    client, headers, _ = auth_client

    # 获取当前限制（应该为空）
    response = await client.get("/api/usage/limits", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    limits_before = data["data"]["limits"]

    # 更新限制
    response = await client.put("/api/usage/limits", headers=headers, json={
        "max_tokens": 1000000,
        "period": "monthly",
        "is_active": True,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    new_limit = data["data"]
    assert new_limit["max_tokens"] == 1000000
    assert new_limit["period"] == "monthly"
    assert new_limit["is_active"] is True

    # 再次获取限制（应该有 1 条新记录）
    response = await client.get("/api/usage/limits", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]["limits"]) == len(limits_before) + 1


@pytest.mark.asyncio
async def test_update_limits_validation(auth_client):
    """测试更新限制的输入校验。"""
    client, headers, _ = auth_client

    # max_tokens 为 0 应被拒绝
    response = await client.put("/api/usage/limits", headers=headers, json={
        "max_tokens": 0,
        "period": "monthly",
        "is_active": True,
    })
    assert response.status_code == 422

    # max_tokens 为负数应被拒绝
    response = await client.put("/api/usage/limits", headers=headers, json={
        "max_tokens": -1,
        "period": "monthly",
        "is_active": True,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_check_budget_no_limit(auth_client):
    """测试未设置预算的项目。"""
    client, headers, _ = auth_client
    project_id = await _create_project(client, headers, budget_limit=0)

    response = await client.get(f"/api/usage/projects/{project_id}/budget", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    budget = data["data"]
    assert budget["status"] == "ok"
    assert "未设置预算限制" in budget["message"]


@pytest.mark.asyncio
async def test_check_budget_ok(auth_client):
    """测试预算使用正常（< 80%）。"""
    client, headers, _ = auth_client
    project_id = await _create_project(client, headers, budget_limit=100.0)

    response = await client.get(f"/api/usage/projects/{project_id}/budget", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    budget = data["data"]
    assert budget["status"] == "ok"
    assert budget["usage_percent"] < 80


@pytest.mark.asyncio
async def test_check_budget_warning(auth_client):
    """测试预算使用达到 80% 提醒。"""
    client, headers, _ = auth_client
    # 预算设为 0.01，花费 0.0105 > 80%
    project_id = await _create_project(client, headers, budget_limit=0.012)

    response = await client.get(f"/api/usage/projects/{project_id}/budget", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    budget = data["data"]
    assert budget["status"] == "warning"
    assert budget["usage_percent"] >= 80


@pytest.mark.asyncio
async def test_check_budget_blocked(auth_client):
    """测试预算使用达到 100% 阻止。"""
    client, headers, _ = auth_client
    # 预算设为 0.01，花费 0.0105 >= 100%
    project_id = await _create_project(client, headers, budget_limit=0.01)

    response = await client.get(f"/api/usage/projects/{project_id}/budget", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    budget = data["data"]
    assert budget["status"] == "blocked"
    assert budget["usage_percent"] >= 100


@pytest.mark.asyncio
async def test_check_budget_nonexistent_project(auth_client):
    """测试检查不存在项目的预算。"""
    client, headers, _ = auth_client
    response = await client.get("/api/usage/projects/nonexistent/budget", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert "项目不存在" in data["data"]["message"]


@pytest.mark.asyncio
async def test_ollama_cost_is_zero(auth_client):
    """测试 Ollama 模型成本为 0 但记录 Token 数。"""
    client, headers, _ = auth_client
    project_id = await _create_project(client, headers)

    response = await client.get(f"/api/usage/projects/{project_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    usage = data["data"]

    # 找到 Ollama 的记录
    ollama_models = [m for m in usage["by_model"] if m["model"] == "ollama"]
    assert len(ollama_models) == 1
    ollama = ollama_models[0]
    # Ollama 成本为 0
    assert ollama["cost"] == 0.0
    # 但记录了 Token 数
    assert ollama["tokens"] > 0
    assert ollama["input_tokens"] > 0
    assert ollama["output_tokens"] > 0


@pytest.mark.asyncio
async def test_unauthorized_access(client):
    """测试未认证访问用量端点。"""
    response = await client.get("/api/usage/summary")
    assert response.status_code == 401

    response = await client.get("/api/usage/daily")
    assert response.status_code == 401

    response = await client.get("/api/usage/limits")
    assert response.status_code == 401

    response = await client.get("/api/usage/projects/test-id")
    assert response.status_code == 401