"""M5 产出物管理测试。"""
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
    # 清除 M0 配置缓存
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


@pytest_asyncio.fixture
async def auth_client(client):
    """创建已认证的测试客户端。"""
    # 注册
    await client.post("/api/auth/register", json={
        "email": "artifact_test@example.com",
        "password": "test123456",
    })
    # 登录
    login_resp = await client.post("/api/auth/login", json={
        "email": "artifact_test@example.com",
        "password": "test123456",
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, token, headers


@pytest_asyncio.fixture
async def project_id(auth_client):
    """创建测试项目。"""
    client, token, headers = auth_client
    response = await client.post("/api/projects", json={
        "name": "产出物测试项目",
        "team_size": 5,
        "target_weeks": 8,
        "budget_limit": 100000,
        "industry": "消费电子",
    }, headers=headers)
    return response.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_artifact(auth_client, project_id):
    """测试创建产出物。"""
    client, token, headers = auth_client

    response = await client.post("/api/artifacts", json={
        "project_id": project_id,
        "artifact_type": "prd",
        "name": "智能手表 PRD",
        "content": "# 产品需求文档\n\n## 功能概述\n...",
        "stage": "plan",
    }, headers=headers)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "智能手表 PRD"
    assert data["artifact_type"] == "prd"
    assert data["stage"] == "plan"
    assert data["version"] == 1
    assert data["project_id"] == project_id
    assert "id" in data


@pytest.mark.asyncio
async def test_version_management(auth_client, project_id):
    """测试产出物版本管理。"""
    client, token, headers = auth_client

    # 创建产出物
    response = await client.post("/api/artifacts", json={
        "project_id": project_id,
        "artifact_type": "mrd",
        "name": "智能手表 MRD",
        "content": "# MRD v1\n\n初始版本",
        "stage": "concept",
    }, headers=headers)
    artifact_id = response.json()["data"]["id"]

    # 更新产出物（创建新版本）
    response = await client.put(f"/api/artifacts/{artifact_id}", json={
        "content": "# MRD v2\n\n更新后的版本",
        "change_summary": "补充竞品分析数据",
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["version"] == 2
    assert "更新后的版本" in data["content"]

    # 获取版本历史
    response = await client.get(f"/api/artifacts/{artifact_id}/versions", headers=headers)
    assert response.status_code == 200
    versions = response.json()["data"]
    assert len(versions) == 2
    assert versions[0]["version"] == 2
    assert versions[1]["version"] == 1

    # 获取特定版本
    response = await client.get(f"/api/artifacts/{artifact_id}/versions/1", headers=headers)
    assert response.status_code == 200
    v1 = response.json()["data"]
    assert v1["version"] == 1
    assert "初始版本" in v1["content"]


@pytest.mark.asyncio
async def test_soft_delete_artifact(auth_client, project_id):
    """测试软删除产出物。"""
    client, token, headers = auth_client

    # 创建产出物
    response = await client.post("/api/artifacts", json={
        "project_id": project_id,
        "artifact_type": "test_cases",
        "name": "测试用例集",
        "content": "# 测试用例\n\n## 用例 1\n...",
        "stage": "develop",
    }, headers=headers)
    artifact_id = response.json()["data"]["id"]

    # 软删除
    response = await client.delete(f"/api/artifacts/{artifact_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["data"]["message"] == "已删除"

    # 删除后获取应返回 404
    response = await client.get(f"/api/artifacts/{artifact_id}", headers=headers)
    assert response.json()["error"] is not None
    assert response.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_list_artifacts_with_filters(auth_client, project_id):
    """测试按阶段和类型筛选产出物。"""
    client, token, headers = auth_client

    # 创建 concept 阶段的产出物
    await client.post("/api/artifacts", json={
        "project_id": project_id,
        "artifact_type": "mrd",
        "name": "MRD",
        "content": "MRD 内容",
        "stage": "concept",
    }, headers=headers)

    # 创建 plan 阶段的产出物
    await client.post("/api/artifacts", json={
        "project_id": project_id,
        "artifact_type": "prd",
        "name": "PRD",
        "content": "PRD 内容",
        "stage": "plan",
    }, headers=headers)

    # 按阶段筛选
    response = await client.get(
        f"/api/artifacts?project_id={project_id}&stage=concept",
        headers=headers,
    )
    assert response.status_code == 200
    artifacts = response.json()["data"]
    assert len(artifacts) == 1
    assert artifacts[0]["stage"] == "concept"

    # 按类型筛选
    response = await client.get(
        f"/api/artifacts?project_id={project_id}&type=prd",
        headers=headers,
    )
    assert response.status_code == 200
    artifacts = response.json()["data"]
    assert len(artifacts) == 1
    assert artifacts[0]["artifact_type"] == "prd"

    # 全部列出
    response = await client.get(
        f"/api/artifacts?project_id={project_id}",
        headers=headers,
    )
    assert response.status_code == 200
    artifacts = response.json()["data"]
    assert len(artifacts) == 2


@pytest.mark.asyncio
async def test_get_artifact_types(auth_client):
    """测试获取产出物类型列表。"""
    client, token, headers = auth_client

    response = await client.get("/api/artifacts/types", headers=headers)
    assert response.status_code == 200
    types = response.json()["data"]
    assert len(types) == 18
    # 验证包含关键类型
    type_keys = [t["key"] for t in types]
    assert "mrd" in type_keys
    assert "prd" in type_keys
    assert "business_case" in type_keys
    assert "gate_materials" in type_keys