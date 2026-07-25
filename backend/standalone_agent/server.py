"""Standalone Agent Server — 独立部署的智能体 HTTP 服务。

每个 IPD Agent 角色可以作为独立的 FastAPI 服务运行，
通过 HTTP API 接受推理请求并返回结果。

启动方式：
    python -m standalone_agent.runner --role product_manager --port 8001
"""
import json
import logging
import time
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .manifest import (
    AgentManifest, AgentCapability,
    AgentInferRequest, AgentInferResponse,
)
from m4_agent_orchestration.llm_router import LLMRouter
from m3_prompt_system.renderer import ROLE_NAMES

logger = logging.getLogger(__name__)


def create_agent_app(role: str, agent_manifest: AgentManifest | None = None) -> FastAPI:
    """创建独立 Agent 的 FastAPI 应用。

    Args:
        role: Agent 角色（如 product_manager）
        agent_manifest: Agent 清单（可选，自动生成）

    Returns:
        FastAPI 应用实例
    """
    app = FastAPI(
        title=f"BLA Standalone Agent — {ROLE_NAMES.get(role, role)}",
        description=f"独立部署的 {ROLE_NAMES.get(role, role)} 智能体服务",
        version=agent_manifest.version if agent_manifest else "1.0.0",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # LLM Router（独立运行时不依赖数据库，使用内存熔断器）
    llm_router = LLMRouter(db=None)

    # 如果未提供 manifest，自动生成
    if agent_manifest is None:
        agent_manifest = AgentManifest(
            id=role,
            name=ROLE_NAMES.get(role, role),
            role=role,
            description=f"{ROLE_NAMES.get(role, role)} 智能体服务",
            capabilities=AgentCapability(
                applicable_stages=["concept", "plan", "develop", "verify", "launch", "lifecycle"],
            ),
        )

    @app.get("/health")
    async def health():
        """健康检查端点。"""
        return {
            "status": "ok",
            "agent_id": agent_manifest.id,
            "agent_name": agent_manifest.name,
            "timestamp": time.time(),
            "version": agent_manifest.version,
        }

    @app.get("/manifest")
    async def get_manifest():
        """获取 Agent 清单（自描述元数据）。"""
        return agent_manifest.model_dump()

    @app.post("/infer", response_model=AgentInferResponse)
    async def infer(request: AgentInferRequest):
        """执行推理。

        接收系统提示词和用户消息，调用 LLM 生成回复。

        Args:
            request: 推理请求

        Returns:
            推理响应（生成内容、Token 用量等）
        """
        try:
            # 确定模型和提供商
            model = request.model or agent_manifest.default_model
            provider = _detect_provider(model)

            # 构建用户消息（如果有历史消息，拼接到一起）
            user_message = request.user_message
            if request.messages:
                # 将历史消息格式化为上下文
                history_parts = []
                for msg in request.messages:
                    role_label = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_parts.append(f"[{role_label}]\n{content}")
                history_text = "\n\n".join(history_parts)
                if user_message:
                    user_message = f"## 对话历史\n\n{history_text}\n\n## 当前输入\n\n{user_message}"
                else:
                    user_message = history_text

            # 调用 LLM
            logger.info(f"[StandaloneAgent:{role}] 调用 LLM: provider={provider}, model={model}")
            result = await llm_router.call(
                system_prompt=request.system_prompt,
                user_message=user_message,
                model=model,
                provider=provider,
                temperature=request.temperature or 0.7,
                max_tokens=request.max_tokens or 32000,
                output_format=request.output_format,
            )

            return AgentInferResponse(
                content=result["content"],
                model=result.get("model", model),
                provider=result.get("provider", provider),
                tokens=result.get("tokens", {"input": 0, "output": 0}),
                metadata={
                    "agent_role": role,
                    "timestamp": time.time(),
                },
            )

        except Exception as e:
            logger.error(f"[StandaloneAgent:{role}] 推理失败: {e}")
            raise HTTPException(status_code=502, detail=f"推理失败: {str(e)}")

    return app


def _detect_provider(model: str) -> str:
    """根据模型名称检测提供商。"""
    model_lower = model.lower()
    if model_lower.startswith("deepseek"):
        return "deepseek"
    elif model_lower.startswith("gpt") or model_lower.startswith("openai"):
        return "openai"
    elif model_lower.startswith("claude"):
        return "anthropic"
    elif model_lower == "mock":
        return "mock"
    else:
        return "ollama"
