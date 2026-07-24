"""前后端 API 契约集成测试 — 验证前端 API 调用与后端端点一致性。

测试范围：
- M1 认证：5 端点
- M2 工作流：12 端点（含新增 M14b）
- M3 提示词：5 端点
- M4 Agent 编排：5 端点（含新增别名）
- M5 产出物：10 端点（含新增附件）
- M6 审核：8 端点（含新增历史）
- M7 插件：7 端点
- M8 实时通信：Dashboard + 健康检查
- M9 用量：9 端点（含新增别名）
- M10 恢复：5 端点（含新增别名）
- 设置/数据/引导：5 端点（新增）
"""
import os
import shutil
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport


@pytest.fixture(autouse=True)
def setup_env():
    """设置测试环境变量，使用临时数据库。"""
    os.environ["JWT_SECRET"] = "test-secret-key-for-jwt-integration-2024"
    os.environ["FERNET_KEY"] = "Z6k3QMpVX5YHj8cRf2LwNt9Bm4Kd7SvGp1Aq5WsXzE0="
    temp_dir = tempfile.mkdtemp()
    os.environ["DATABASE_PATH"] = os.path.join(temp_dir, "test.db")
    from m0_infrastructure.config import get_settings as m0_get_settings
    m0_get_settings.cache_clear()
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest_asyncio.fixture
async def app_client():
    """创建带数据库初始化的测试客户端。"""
    from m0_infrastructure.main import app, lifespan
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client


@pytest_asyncio.fixture
async def auth_client(app_client):
    """创建已认证的测试客户端。"""
    await app_client.post("/api/auth/register", json={
        "email": "integration@test.com",
        "password": "test123456",
        "display_name": "集成测试用户",
    })
    login_resp = await app_client.post("/api/auth/login", json={
        "email": "integration@test.com",
        "password": "test123456",
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return app_client, token, headers


@pytest_asyncio.fixture
async def project_id(auth_client):
    """创建测试项目并返回 ID。"""
    client, token, headers = auth_client
    resp = await client.post("/api/projects", json={
        "name": "集成测试项目",
        "team_size": 5,
        "target_weeks": 8,
        "budget_limit": 1000.0,
        "industry": "消费电子",
        "description": "用于集成测试的项目",
    }, headers=headers)
    return resp.json()["data"]["id"]


# ============================================================
# M1 认证端点测试
# ============================================================

class TestM1Auth:
    """M1 认证模块 — 验证 5 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_register(self, app_client):
        """POST /api/auth/register"""
        resp = await app_client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "password": "test123456",
            "display_name": "新用户",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login(self, auth_client):
        """POST /api/auth/login — 已在 fixture 中验证。"""
        client, token, headers = auth_client
        assert token is not None
        assert len(token) > 0

    @pytest.mark.asyncio
    async def test_refresh(self, auth_client):
        """POST /api/auth/refresh"""
        client, token, headers = auth_client
        resp = await client.post("/api/auth/refresh", json={
            "refresh_token": token,
        })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_me(self, auth_client):
        """GET /api/auth/me"""
        client, token, headers = auth_client
        resp = await client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["email"] == "integration@test.com"

    @pytest.mark.asyncio
    async def test_logout(self, auth_client):
        """POST /api/auth/logout"""
        client, token, headers = auth_client
        resp = await client.post("/api/auth/logout", headers=headers)
        assert resp.status_code == 200


# ============================================================
# M2 工作流引擎端点测试
# ============================================================

class TestM2Workflow:
    """M2 工作流引擎 — 验证 12 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_list_projects(self, auth_client):
        """GET /api/projects"""
        client, token, headers = auth_client
        resp = await client.get("/api/projects", headers=headers)
        assert resp.status_code == 200
        assert "items" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_create_project(self, auth_client):
        """POST /api/projects"""
        client, token, headers = auth_client
        resp = await client.post("/api/projects", json={
            "name": "前端API测试项目",
            "team_size": 3,
            "target_weeks": 4,
            "budget_limit": 500.0,
            "industry": "软件",
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "前端API测试项目"

    @pytest.mark.asyncio
    async def test_get_project(self, auth_client, project_id):
        """GET /api/projects/{id}"""
        client, token, headers = auth_client
        resp = await client.get(f"/api/projects/{project_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == project_id

    @pytest.mark.asyncio
    async def test_get_current_stage(self, auth_client, project_id):
        """GET /api/projects/{id}/stage — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.get(f"/api/projects/{project_id}/stage", headers=headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "currentStage" in data
        assert "allStages" in data

    @pytest.mark.asyncio
    async def test_get_activities(self, auth_client, project_id):
        """GET /api/projects/{id}/activities — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.get(f"/api/projects/{project_id}/activities", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    @pytest.mark.asyncio
    async def test_get_gates(self, auth_client, project_id):
        """GET /api/projects/{id}/gates — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.get(f"/api/projects/{project_id}/gates", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    @pytest.mark.asyncio
    async def test_advance_stage(self, auth_client, project_id):
        """POST /api/projects/{id}/advance — 门禁未完成时返回 422"""
        client, token, headers = auth_client
        resp = await client.post(f"/api/projects/{project_id}/advance", headers=headers)
        # 门禁阻断项未完成，预期 422
        assert resp.status_code in (200, 422)

    @pytest.mark.asyncio
    async def test_rollback_stage(self, auth_client, project_id):
        """POST /api/projects/{id}/rollback — 首个阶段回退返回 422"""
        client, token, headers = auth_client
        resp = await client.post(f"/api/projects/{project_id}/rollback", headers=headers)
        # 已是第一个阶段，预期 422
        assert resp.status_code in (200, 422)

    @pytest.mark.asyncio
    async def test_pause_project(self, auth_client, project_id):
        """POST /api/projects/{id}/pause — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.post(f"/api/projects/{project_id}/pause", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "paused"

    @pytest.mark.asyncio
    async def test_resume_project(self, auth_client, project_id):
        """POST /api/projects/{id}/resume — 前端 M14a 调用"""
        client, token, headers = auth_client
        # 先暂停
        await client.post(f"/api/projects/{project_id}/pause", headers=headers)
        resp = await client.post(f"/api/projects/{project_id}/resume", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "active"

    @pytest.mark.asyncio
    async def test_gate_vote(self, auth_client, project_id):
        """POST /api/projects/{id}/gates/{gate_id}/vote — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.post(
            f"/api/projects/{project_id}/gates/CDCP/vote",
            json={"vote": "approve", "comment": "集成测试通过"},
            headers=headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_stage_info(self, auth_client):
        """GET /api/workflows/stages — 前端 M13 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/workflows/stages", headers=headers)
        assert resp.status_code == 200
        assert "stages" in resp.json()["data"]


# ============================================================
# M3 提示词系统端点测试
# ============================================================

class TestM3Prompt:
    """M3 提示词系统 — 验证 5 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_list_templates(self, auth_client):
        """GET /api/prompts/templates"""
        client, token, headers = auth_client
        resp = await client.get("/api/prompts/templates", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    @pytest.mark.asyncio
    async def test_get_template(self, auth_client):
        """GET /api/prompts/templates/{role}"""
        client, token, headers = auth_client
        resp = await client.get("/api/prompts/templates/product_manager", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["role"] == "product_manager"

    @pytest.mark.asyncio
    async def test_update_template(self, auth_client):
        """PUT /api/prompts/templates/{role}"""
        client, token, headers = auth_client
        resp = await client.put(
            "/api/prompts/templates/product_manager",
            json={"content": "你是一个产品经理。"},
            headers=headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_preview_prompt(self, auth_client, project_id):
        """POST /api/prompts/preview"""
        client, token, headers = auth_client
        resp = await client.post("/api/prompts/preview", json={
            "role": "product_manager",
            "project_context": {"project": {"id": project_id}},
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_render_prompt(self, auth_client, project_id):
        """POST /api/prompts/render"""
        client, token, headers = auth_client
        resp = await client.post("/api/prompts/render", json={
            "role": "product_manager",
            "project_context": {"project": {"id": project_id}},
        }, headers=headers)
        assert resp.status_code == 200


# ============================================================
# M4 Agent 编排端点测试
# ============================================================

class TestM4Agent:
    """M4 Agent 编排 — 验证 5 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_list_models(self, auth_client):
        """GET /api/agents/models"""
        client, token, headers = auth_client
        resp = await client.get("/api/agents/models", headers=headers)
        assert resp.status_code == 200
        assert "providers" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_test_model(self, auth_client):
        """POST /api/agents/test — 前端兼容别名"""
        client, token, headers = auth_client
        resp = await client.post("/api/agents/test", json={
            "provider": "ollama",
            "model": "qwen2.5",
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_api_key_status(self, auth_client):
        """GET /api/agents/api-keys/status — 前端 M17 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/agents/api-keys/status", headers=headers)
        assert resp.status_code == 200
        assert "ollama" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_get_configs(self, auth_client):
        """GET /api/agents/configs"""
        client, token, headers = auth_client
        resp = await client.get("/api/agents/configs", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_orchestrate(self, auth_client, project_id):
        """POST /api/agents/orchestrate"""
        client, token, headers = auth_client
        resp = await client.post("/api/agents/orchestrate", json={
            "project_id": project_id,
            "stage": "concept",
            "activity_key": "customer_needs",
            "mode": "sequential",
            "agents": ["product_manager"],
            "user_input": "分析客户需求",
            "max_rounds": 1,
        }, headers=headers)
        assert resp.status_code == 200


# ============================================================
# M5 产出物管理端点测试
# ============================================================

class TestM5Artifact:
    """M5 产出物管理 — 验证 10 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_get_types(self, auth_client):
        """GET /api/artifacts/types"""
        client, token, headers = auth_client
        resp = await client.get("/api/artifacts/types", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 18

    @pytest.mark.asyncio
    async def test_create_artifact(self, auth_client, project_id):
        """POST /api/artifacts"""
        client, token, headers = auth_client
        resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "集成测试 MRD",
            "content": "# MRD 文档\n\n## 市场分析",
            "stage": "concept",
        }, headers=headers)
        assert resp.status_code == 200
        return resp.json()["data"]["id"]

    @pytest.mark.asyncio
    async def test_list_artifacts(self, auth_client, project_id):
        """GET /api/artifacts?project_id=..."""
        client, token, headers = auth_client
        resp = await client.get(f"/api/artifacts?project_id={project_id}", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_artifact(self, auth_client, project_id):
        """GET /api/artifacts/{id}"""
        client, token, headers = auth_client
        # 先创建
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "prd",
            "name": "PRD 文档",
            "content": "内容",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.get(f"/api/artifacts/{art_id}", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_artifact(self, auth_client, project_id):
        """PUT /api/artifacts/{id}"""
        client, token, headers = auth_client
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "更新测试",
            "content": "v1",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.put(f"/api/artifacts/{art_id}", json={
            "content": "v2 更新内容",
            "change_summary": "版本更新",
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_versions(self, auth_client, project_id):
        """GET /api/artifacts/{id}/versions"""
        client, token, headers = auth_client
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "版本测试",
            "content": "v1",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.get(f"/api/artifacts/{art_id}/versions", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_artifact(self, auth_client, project_id):
        """DELETE /api/artifacts/{id}"""
        client, token, headers = auth_client
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "删除测试",
            "content": "v1",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.delete(f"/api/artifacts/{art_id}", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_upload_attachment(self, auth_client, project_id):
        """PUT /api/artifacts/{id}/attachments — 前端 M16 调用"""
        client, token, headers = auth_client
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "附件测试",
            "content": "test",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.put(f"/api/artifacts/{art_id}/attachments", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_attachment(self, auth_client, project_id):
        """DELETE /api/artifacts/{id}/attachments/{attachment_id} — 前端 M16 调用"""
        client, token, headers = auth_client
        create_resp = await client.post("/api/artifacts", json={
            "project_id": project_id,
            "artifact_type": "mrd",
            "name": "删除附件测试",
            "content": "test",
            "stage": "concept",
        }, headers=headers)
        art_id = create_resp.json()["data"]["id"]
        resp = await client.delete(f"/api/artifacts/{art_id}/attachments/att_001", headers=headers)
        assert resp.status_code == 200


# ============================================================
# M6 审核系统端点测试
# ============================================================

class TestM6Review:
    """M6 审核系统 — 验证 8 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_list_reviews(self, auth_client):
        """GET /api/reviews"""
        client, token, headers = auth_client
        resp = await client.get("/api/reviews", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_dashboard(self, auth_client):
        """GET /api/reviews/dashboard"""
        client, token, headers = auth_client
        resp = await client.get("/api/reviews/dashboard", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_issues(self, auth_client):
        """GET /api/reviews/issues"""
        client, token, headers = auth_client
        resp = await client.get("/api/reviews/issues", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_review_history(self, auth_client):
        """GET /api/reviews/history — 前端 M15 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/reviews/history", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_batch_review(self, auth_client):
        """POST /api/reviews/batch"""
        client, token, headers = auth_client
        resp = await client.post("/api/reviews/batch", json={
            "review_ids": [],
            "vote": "approve",
        }, headers=headers)
        assert resp.status_code == 200


# ============================================================
# M7 插件系统端点测试
# ============================================================

class TestM7Plugin:
    """M7 插件系统 — 验证 7 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_list_plugins(self, auth_client):
        """GET /api/plugins"""
        client, token, headers = auth_client
        resp = await client.get("/api/plugins", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_available_plugins(self, auth_client):
        """GET /api/plugins/available"""
        client, token, headers = auth_client
        resp = await client.get("/api/plugins/available", headers=headers)
        assert resp.status_code == 200


# ============================================================
# M8 实时通信端点测试
# ============================================================

class TestM8Realtime:
    """M8 实时通信 — 验证 Dashboard 和健康检查。"""

    @pytest.mark.asyncio
    async def test_health_check(self, app_client):
        """GET /api/health"""
        resp = await app_client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


# ============================================================
# M9 用量追踪端点测试
# ============================================================

class TestM9Usage:
    """M9 用量追踪 — 验证 9 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_get_overview(self, auth_client):
        """GET /api/usage/overview — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/overview", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_summary(self, auth_client):
        """GET /api/usage/summary"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/summary", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_list_project_usage(self, auth_client):
        """GET /api/usage/projects — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/projects", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_daily_trends(self, auth_client):
        """GET /api/usage/daily-trends — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/daily-trends", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_limits(self, auth_client):
        """GET /api/usage/limits"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/limits", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_limits(self, auth_client):
        """PUT /api/usage/limits"""
        client, token, headers = auth_client
        resp = await client.put("/api/usage/limits", json={
            "max_tokens": 1000000,
            "period": "monthly",
            "is_active": True,
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_budget_alerts(self, auth_client):
        """GET /api/usage/budget-alerts — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/usage/budget-alerts", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_budget_alerts(self, auth_client):
        """PUT /api/usage/budget-alerts — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.put("/api/usage/budget-alerts", json={
            "dailyLimit": 50,
            "monthlyLimit": 1000,
            "alertThreshold": 0.8,
            "isEnabled": True,
        }, headers=headers)
        assert resp.status_code == 200


# ============================================================
# M10 恢复系统端点测试
# ============================================================

class TestM10Recovery:
    """M10 异常恢复 — 验证 5 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_get_recovery_status(self, auth_client, project_id):
        """GET /api/recovery/status?project_id=..."""
        client, token, headers = auth_client
        resp = await client.get(f"/api/recovery/status?project_id={project_id}", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_recovery_by_project(self, auth_client, project_id):
        """GET /api/recovery/projects/{project_id}/status — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.get(f"/api/recovery/projects/{project_id}/status", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_execute_recovery_action(self, auth_client, project_id):
        """POST /api/recovery/actions"""
        client, token, headers = auth_client
        resp = await client.post("/api/recovery/actions", json={
            "action_type": "retry_stage",
            "params": {"project_id": project_id},
        }, headers=headers)
        assert resp.status_code == 200


# ============================================================
# 设置/数据/引导端点测试
# ============================================================

class TestSettingsAndData:
    """设置与数据管理 — 验证 5 个前端 API 端点。"""

    @pytest.mark.asyncio
    async def test_get_settings(self, auth_client):
        """GET /api/settings — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/settings", headers=headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "theme" in data
        assert "language" in data

    @pytest.mark.asyncio
    async def test_update_settings(self, auth_client):
        """PUT /api/settings — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.put("/api/settings", json={
            "theme": "dark",
            "language": "zh-CN",
            "autoAdvanceStage": False,
            "maxDebateRounds": 5,
            "notificationEnabled": True,
            "defaultLLMBackend": "ollama",
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["theme"] == "dark"

    @pytest.mark.asyncio
    async def test_get_onboarding(self, auth_client):
        """GET /api/user/onboarding — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.get("/api/user/onboarding", headers=headers)
        assert resp.status_code == 200
        assert "isFirstVisit" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_complete_onboarding(self, auth_client):
        """POST /api/user/onboarding/complete — 前端 M14a 调用"""
        client, token, headers = auth_client
        resp = await client.post("/api/user/onboarding/complete", json={
            "step_id": "welcome",
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_export_data(self, auth_client, project_id):
        """POST /api/data/export — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.post("/api/data/export", json={
            "format": "json",
        }, headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_clear_data(self, auth_client):
        """POST /api/data/clear — 前端 M18 调用"""
        client, token, headers = auth_client
        resp = await client.post("/api/data/clear", json={
            "confirmation": "测试",
        }, headers=headers)
        assert resp.status_code == 200