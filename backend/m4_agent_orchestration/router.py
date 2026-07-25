"""Agent 编排路由 — M4。

包含 Agent 编排、远程 Agent 注册与发现端点。
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from .models import (
    OrchestrateRequest, AgentConfigRequest,
    ModelTestRequest, SkillExecuteRequest,
)
from .orchestrator import Orchestrator
from .llm_router import LLMRouter
from m7_plugin_system.tool_bridge import SkillToolBridge
from standalone_agent.registry import AgentRegistryClient
from standalone_agent.manifest import AgentRegisterRequest

router = APIRouter(prefix="/api/agents", tags=["Agent 编排"])


@router.post("/orchestrate")
async def orchestrate(
    request: OrchestrateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """触发 Agent 协作。"""
    orchestrator = Orchestrator(db)
    result = await orchestrator.orchestrate(
        project_id=request.project_id,
        stage=request.stage,
        activity_key=request.activity_key,
        mode=request.mode,
        agents=request.agents,
        user_input=request.user_input,
        max_rounds=request.max_rounds,
    )
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.get("/models")
async def list_models(user: dict = Depends(get_current_user)):
    """获取可用模型列表。"""
    return {
        "data": {
            "providers": [
                {
                    "name": "deepseek",
                    "label": "DeepSeek（云端，中文优化）",
                    "models": ["deepseek-chat", "deepseek-reasoner"],
                    "default": True,
                },
                {
                    "name": "ollama",
                    "label": "Ollama（本地）",
                    "models": ["qwen2.5", "llama3.2", "deepseek-r1"],
                    "default": False,
                },
                {
                    "name": "anthropic",
                    "label": "Anthropic（云端）",
                    "models": ["claude-sonnet-4-5", "claude-haiku-4-5"],
                    "default": False,
                },
                {
                    "name": "openai",
                    "label": "OpenAI（云端）",
                    "models": ["gpt-4o", "gpt-4o-mini"],
                    "default": False,
                },
            ]
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/models/test")
async def test_model(
    request: ModelTestRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """测试模型连接。"""
    llm_router = LLMRouter(db=db, user_id=user["id"])
    result = await llm_router.test_connection(request.provider, request.model)
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/test")
async def test_model_alias(
    request: ModelTestRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """测试模型连接（前端兼容别名 POST /api/agents/test）。"""
    llm_router = LLMRouter(db=db, user_id=user["id"])
    result = await llm_router.test_connection(request.provider, request.model)
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.post("/api-keys")
async def store_api_key(
    request: dict,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """保存 API Key（加密存储到 secrets 表）。

    前端传入 {backend: "deepseek"|"anthropic"|"openai", api_key: "sk-..."}。
    """
    from m1_auth_security.auth_service import AuthService
    key_name = request.get("backend", "")
    api_key = request.get("api_key", "")
    if not key_name or not api_key:
        from shared.errors import AppException, ErrorCode
        raise AppException(ErrorCode.VALIDATION_ERROR, "backend 和 api_key 不能为空", status_code=422)
    service = AuthService(db)
    result = await service.store_api_key(user["id"], key_name, api_key)
    return {"data": result, "error": None, "meta": {"request_id": ""}}


@router.get("/api-keys/status")
async def get_api_key_status(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取 API Key 配置状态（各后端是否已配置）。"""
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT key_name FROM secrets WHERE user_id = :user_id AND deleted_at IS NULL"),
        {"user_id": user["id"]},
    )
    keys = {row.key_name: True for row in result.fetchall()}
    return {
        "data": {
            "deepseek": keys.get("deepseek", False),
            "anthropic": keys.get("anthropic", False),
            "openai": keys.get("openai", False),
            "ollama": True,  # Ollama 本地运行，始终可用
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.get("/configs")
async def list_configs(user: dict = Depends(get_current_user)):
    """获取 Agent 配置列表。"""
    from m3_prompt_system.renderer import ROLE_NAMES
    configs = []
    for role, name in ROLE_NAMES.items():
        configs.append({
            "role": role,
            "name": name,
            "model": "ollama",
            "temperature": 0.7,
            "max_tokens": 32000,
        })
    return {"data": configs, "error": None, "meta": {"request_id": ""}}


@router.post("/skills/execute", response_model=dict)
async def execute_skill(
    request: SkillExecuteRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """执行 Skill 工具。

    允许前端直接调用 Skill 生成产出物。
    支持 3 个 Skill 的 5 个工具：
    - analyze_data (ipd-data-analysis)
    - generate_xlsx (ipd-xlsx)
    - generate_docx (ipd-docx)
    """
    bridge = SkillToolBridge()
    try:
        result = await bridge.execute_tool(
            tool_name=request.tool_name,
            project_id=request.project_id,
            stage=request.stage,
            activity_key=request.activity_key,
            agent_role=request.agent_role,
            params=request.params,
            user_input=request.user_input,
        )
        return {
            "data": {
                "success": result.success,
                "skill_name": result.skill_name,
                "output": result.output,
                "file_path": result.file_path,
                "file_type": result.file_type,
                "artifact_type": result.artifact_type,
                "tokens_used": result.tokens_used,
                "metadata": result.metadata,
                "error_message": result.error_message,
            },
            "error": None,
            "meta": {"request_id": ""},
        }
    except ValueError as e:
        return {
            "data": None,
            "error": {"code": "SKILL_NOT_FOUND", "message": str(e)},
            "meta": {"request_id": ""},
        }


@router.get("/skills/list", response_model=dict)
async def list_skills(
    user: dict = Depends(get_current_user),
):
    """列出所有可用的 Skill 工具。"""
    bridge = SkillToolBridge()
    tools = bridge.get_all_tools()
    return {
        "data": {
            "skills": bridge.registry.list_skills(),
            "tools": [
                {
                    "tool_name": t["tool_name"],
                    "skill_name": t["skill_name"],
                    "description": t.get("description", ""),
                }
                for t in tools
            ],
        },
        "error": None,
        "meta": {"request_id": ""},
    }


# ════════════════════════════════════════════════════════════
# 独立 Agent 注册与发现（Standalone Agent）
# ════════════════════════════════════════════════════════════


@router.get("/registry")
async def list_registered_agents(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """列出所有已注册的 Agent（本地 + 远程）。"""
    registry = AgentRegistryClient(db=db)
    agents = await registry.list_agents(include_offline=True)
    return {
        "data": {"agents": [a.model_dump() for a in agents]},
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/registry")
async def register_agent(
    request: AgentRegisterRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """注册一个远程独立 Agent。

    通过 URL 发现并注册远程 Agent 服务。
    注册后引擎将优先使用远程 Agent 而非本地 LLM 调用。

    请求体:
        role: Agent 角色（product_manager/rd/qa/marketing/manufacturing/finance）
        url: Agent 服务 URL（如 http://192.168.1.100:8001）
        name: 显示名称（可选）
        api_key: API Key（可选）

    流程:
        1. 向 URL 发送 GET /manifest 获取 Agent 清单
        2. 验证清单与角色匹配
        3. 保存注册信息
        4. 后续编排将路由到该远程 Agent
    """
    registry = AgentRegistryClient(db=db)
    try:
        response = await registry.register_remote(request)
        return {
            "data": response.model_dump(),
            "error": None,
            "meta": {"request_id": ""},
        }
    except ConnectionError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")


@router.delete("/registry/{role}")
async def unregister_agent(
    role: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取消注册一个远程 Agent。"""
    registry = AgentRegistryClient(db=db)
    success = await registry.unregister(role)
    return {
        "data": {"unregistered": success, "role": role},
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/registry/health")
async def health_check_agents(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """对所有注册的远程 Agent 执行健康检查。"""
    registry = AgentRegistryClient(db=db)
    results = await registry.health_check_all()
    return {
        "data": {"health": results},
        "error": None,
        "meta": {"request_id": ""},
    }