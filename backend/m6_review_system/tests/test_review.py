"""M6 审核系统测试。"""

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
    """创建已认证的测试客户端（含 token 和 headers）。"""
    # 注册
    await client.post("/api/auth/register", json={
        "email": "review_test@example.com",
        "password": "test123456",
    })
    # 登录
    login_resp = await client.post("/api/auth/login", json={
        "email": "review_test@example.com",
        "password": "test123456",
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, token, headers


@pytest_asyncio.fixture
async def auth_client_with_project(client):
    """创建已认证的测试客户端，并预先创建一个项目。"""
    # 注册 + 登录
    await client.post("/api/auth/register", json={
        "email": "review_proj@example.com",
        "password": "test123456",
    })
    login_resp = await client.post("/api/auth/login", json={
        "email": "review_proj@example.com",
        "password": "test123456",
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 创建项目
    proj_resp = await client.post("/api/projects", json={
        "name": "审核测试项目",
        "team_size": 5,
        "target_weeks": 8,
        "budget_limit": 100000,
        "industry": "消费电子",
    }, headers=headers)
    project_id = proj_resp.json()["data"]["id"]

    return client, token, headers, project_id


# ------------------------------------------------------------------
# 测试 1：审核列表
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_reviews(auth_client):
    """测试获取审核列表（空列表）。"""
    client, token, headers = auth_client

    response = await client.get("/api/reviews", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "items" in data
    assert "total" in data
    assert data["total"] == 0


# ------------------------------------------------------------------
# 测试 2：提交投票（单人模式自动通过）
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_vote_single_user_mode(auth_client_with_project):
    """测试提交投票 — 单人模式自动通过，标注 auto_approved_due_to_single_user_mode。"""
    client, token, headers, project_id = auth_client_with_project

    from sqlalchemy import text
    from m0_infrastructure.database import _session_factory

    # 先手动创建一个审核任务
    async with _session_factory() as db:
        await db.execute(
            text(
                "INSERT INTO review_tasks (id, project_id, gate_id, status, created_at, updated_at) "
                "VALUES (:id, :project_id, :gate_id, :status, :created_at, :updated_at)"
            ),
            {
                "id": "rvw_test_001",
                "project_id": project_id,
                "gate_id": "CDCP",
                "status": "pending",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00",
            },
        )
        await db.commit()

    # 提交投票
    response = await client.post(
        "/api/reviews/rvw_test_001/vote",
        json={"gate_id": "CDCP", "vote": "approve", "comment": "测试审核"},
        headers=headers,
    )
    assert response.status_code == 200
    result = response.json()["data"]
    assert result["is_auto_approved"] is True
    assert result["mode"] == "single_user"
    assert "auto_approved_due_to_single_user_mode" in result["comment"]


# ------------------------------------------------------------------
# 测试 3：审核详情
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_review_detail(auth_client_with_project):
    """测试获取审核详情（含投票记录和遗留问题）。"""
    client, token, headers, project_id = auth_client_with_project

    from sqlalchemy import text
    from m0_infrastructure.database import _session_factory

    async with _session_factory() as db:
        # 创建审核任务
        await db.execute(
            text(
                "INSERT INTO review_tasks (id, project_id, gate_id, status, created_at, updated_at) "
                "VALUES (:id, :project_id, :gate_id, :status, :created_at, :updated_at)"
            ),
            {
                "id": "rvw_test_002",
                "project_id": project_id,
                "gate_id": "PDCP",
                "status": "pending",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00",
            },
        )

        # 创建投票记录
        await db.execute(
            text(
                "INSERT INTO gate_results (id, project_id, stage, gate_id, attempt, "
                "voter_role, vote, comment, is_auto_approved, created_at) "
                "VALUES (:id, :project_id, :stage, :gate_id, :attempt, "
                ":voter_role, :vote, :comment, :is_auto_approved, :created_at)"
            ),
            {
                "id": "gtr_test_001",
                "project_id": project_id,
                "stage": "plan",
                "gate_id": "PDCP",
                "attempt": 1,
                "voter_role": "reviewer",
                "vote": "approve",
                "comment": "auto_approved_due_to_single_user_mode",
                "is_auto_approved": 1,
                "created_at": "2025-01-01 00:00:00",
            },
        )

        # 创建遗留问题
        await db.execute(
            text(
                "INSERT INTO review_issues (id, project_id, gate_id, description, status, created_at) "
                "VALUES (:id, :project_id, :gate_id, :description, :status, :created_at)"
            ),
            {
                "id": "isu_test_001",
                "project_id": project_id,
                "gate_id": "PDCP",
                "description": "测试遗留问题",
                "status": "open",
                "created_at": "2025-01-01 00:00:00",
            },
        )

        await db.commit()

    response = await client.get("/api/reviews/rvw_test_002", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["gate_id"] == "PDCP"
    assert len(data["votes"]) >= 1
    assert len(data["issues"]) >= 1
    assert data["votes"][0]["is_auto_approved"] is True


# ------------------------------------------------------------------
# 测试 4：仪表盘
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dashboard(auth_client_with_project):
    """测试审核仪表盘聚合数据。"""
    client, token, headers, project_id = auth_client_with_project

    from sqlalchemy import text
    from m0_infrastructure.database import _session_factory

    async with _session_factory() as db:
        await db.execute(
            text(
                "INSERT INTO review_tasks (id, project_id, gate_id, status, created_at, updated_at) "
                "VALUES (:id, :project_id, :gate_id, :status, :created_at, :updated_at)"
            ),
            {
                "id": "rvw_dash_001",
                "project_id": project_id,
                "gate_id": "CDCP",
                "status": "approved",
                "auto_approved": 1,
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00",
            },
        )
        await db.commit()

    response = await client.get("/api/reviews/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "total_reviews" in data
    assert "status_breakdown" in data
    assert "open_issues" in data
    assert "total_issues" in data
    assert "recent_votes" in data
    assert data["mode"] == "single_user"
    assert data["total_reviews"] >= 1


# ------------------------------------------------------------------
# 测试 5：审核升级
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_escalate(auth_client_with_project):
    """测试审核升级 — 创建遗留问题。"""
    client, token, headers, project_id = auth_client_with_project

    from sqlalchemy import text
    from m0_infrastructure.database import _session_factory

    async with _session_factory() as db:
        await db.execute(
            text(
                "INSERT INTO review_tasks (id, project_id, gate_id, status, created_at, updated_at) "
                "VALUES (:id, :project_id, :gate_id, :status, :created_at, :updated_at)"
            ),
            {
                "id": "rvw_esc_001",
                "project_id": project_id,
                "gate_id": "TR3",
                "status": "pending",
                "created_at": "2025-01-01 00:00:00",
                "updated_at": "2025-01-01 00:00:00",
            },
        )
        await db.commit()

    response = await client.post(
        "/api/reviews/rvw_esc_001/escalate",
        json={"reason": "需要高级别评审"},
        headers=headers,
    )
    assert response.status_code == 200
    result = response.json()["data"]
    assert result["status"] == "escalated"
    assert "issue_id" in result
    assert result["reason"] == "需要高级别评审"


# ------------------------------------------------------------------
# 测试 6：遗留问题列表
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_issues(auth_client):
    """测试获取遗留问题列表。"""
    client, token, headers = auth_client

    response = await client.get("/api/reviews/issues", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "items" in data
    assert "total" in data


# ------------------------------------------------------------------
# 测试 7：批量审核
# ------------------------------------------------------------------

@pytest.mark.asyncio
async def test_batch_vote(auth_client_with_project):
    """测试批量审核。"""
    client, token, headers, project_id = auth_client_with_project

    from sqlalchemy import text
    from m0_infrastructure.database import _session_factory

    async with _session_factory() as db:
        for i in range(3):
            await db.execute(
                text(
                    "INSERT INTO review_tasks (id, project_id, gate_id, status, created_at, updated_at) "
                    "VALUES (:id, :project_id, :gate_id, :status, :created_at, :updated_at)"
                ),
                {
                    "id": f"rvw_batch_{i:03d}",
                    "project_id": project_id,
                    "gate_id": f"GATE_BATCH_{i}",
                    "status": "pending",
                    "created_at": "2025-01-01 00:00:00",
                    "updated_at": "2025-01-01 00:00:00",
                },
            )
        await db.commit()

    response = await client.post(
        "/api/reviews/batch",
        json={
            "review_ids": ["rvw_batch_000", "rvw_batch_001", "rvw_batch_002"],
            "vote": "approve",
        },
        headers=headers,
    )
    assert response.status_code == 200
    result = response.json()["data"]
    assert result["total"] == 3
    assert len(result["results"]) == 3
    for r in result["results"]:
        assert r["success"] is True
        assert "单人模式" in r["message"]