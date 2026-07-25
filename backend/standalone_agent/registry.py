"""Agent Registry — 智能体注册与发现。

主引擎通过 Registry 管理所有可用的 Agent（本地 + 远程）。
远程 Agent 通过 URL 注册，引擎通过 HTTP 调用它们。
"""
import json
import time
import logging
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.config import get_settings
from .manifest import (
    AgentManifest, AgentInferRequest, AgentInferResponse,
    AgentRegisterRequest, AgentRegisterResponse,
)

logger = logging.getLogger(__name__)


class AgentRegistryClient:
    """Agent 注册客户端。

    管理已注册的 Agent（包括本地内置角色和远程独立 Agent）。
    提供基于 URL 的发现和调用能力。
    """

    def __init__(self, db: AsyncSession | None = None):
        self.db = db
        self.settings = get_settings()
        # 内存缓存：role -> AgentManifest
        self._local_agents: dict[str, AgentManifest] = {}
        # 从数据库加载的注册信息
        self._remote_agents: dict[str, AgentManifest] = {}

    # ── 注册管理 ──────────────────────────────────────

    async def register_local(self, manifest: AgentManifest) -> None:
        """注册本地内置 Agent。

        Args:
            manifest: Agent 清单
        """
        manifest.is_online = True
        manifest.registered_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._local_agents[manifest.role] = manifest
        logger.info(f"[AgentRegistry] 注册本地 Agent: {manifest.name} ({manifest.role})")

    async def register_remote(self, request: AgentRegisterRequest) -> AgentRegisterResponse:
        """注册远程 Agent（通过 URL）。

        流程：
        1. 向 URL 发送 GET /manifest 获取 Agent 清单
        2. 验证清单有效性
        3. 保存到数据库（持久化）
        4. 返回注册结果

        Args:
            request: 注册请求

        Returns:
            注册响应
        """
        agent_id = f"remote_{request.role}_{int(time.time())}"

        # 获取远程 Agent 的 Manifest
        manifest_url = request.url.rstrip("/") + "/manifest"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(manifest_url)
                resp.raise_for_status()
                manifest_data = resp.json()
        except httpx.TimeoutException:
            raise ConnectionError(f"连接超时: {manifest_url}")
        except httpx.HTTPStatusError as e:
            raise ConnectionError(f"获取 Manifest 失败: {e}")
        except Exception as e:
            raise ConnectionError(f"无法连接到 Agent: {e}")

        # 构建 Manifest
        manifest = AgentManifest(
            id=agent_id,
            name=request.name or manifest_data.get("name", request.role),
            role=request.role,
            version=manifest_data.get("version", "1.0.0"),
            description=manifest_data.get("description", ""),
            url=request.url,
            api_key=request.api_key,
            is_online=True,
            registered_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            capabilities=AgentManifest(**manifest_data).capabilities if "capabilities" in manifest_data else {},
        )

        # 持久化到数据库
        if self.db:
            await self._save_to_db(agent_id, request.role, request.url, manifest)

        # 缓存
        self._remote_agents[request.role] = manifest
        logger.info(f"[AgentRegistry] 注册远程 Agent: {manifest.name} @ {request.url}")

        return AgentRegisterResponse(
            id=agent_id,
            manifest=manifest,
            status="registered",
        )

    async def unregister(self, role: str) -> bool:
        """取消注册 Agent。

        Args:
            role: 角色

        Returns:
            是否成功
        """
        removed = False
        if role in self._remote_agents:
            del self._remote_agents[role]
            removed = True
        if role in self._local_agents:
            del self._local_agents[role]
            removed = True

        if self.db and removed:
            await self._remove_from_db(role)

        logger.info(f"[AgentRegistry] 取消注册 Agent: {role}")
        return removed

    # ── 发现与查询 ──────────────────────────────────────

    async def list_agents(self, include_offline: bool = False) -> list[AgentManifest]:
        """列出所有注册的 Agent。

        Args:
            include_offline: 是否包含离线 Agent

        Returns:
            Agent 清单列表
        """
        agents = list(self._local_agents.values()) + list(self._remote_agents.values())
        if not include_offline:
            agents = [a for a in agents if a.is_online]
        return agents

    async def get_agent(self, role: str) -> AgentManifest | None:
        """获取指定角色的 Agent 信息。

        Args:
            role: 角色

        Returns:
            Agent 清单，未找到则返回 None
        """
        # 优先远程（可覆盖内置角色）
        if role in self._remote_agents:
            return self._remote_agents[role]
        return self._local_agents.get(role)

    async def is_remote_agent(self, role: str) -> bool:
        """检查指定角色是否是远程 Agent。"""
        return role in self._remote_agents

    # ── 远程调用 ──────────────────────────────────────

    async def call_remote(
        self,
        role: str,
        system_prompt: str,
        user_message: str = "",
        context: dict | None = None,
    ) -> AgentInferResponse | None:
        """调用远程 Agent 执行推理。

        Args:
            role: Agent 角色
            system_prompt: 系统提示词
            user_message: 用户消息
            context: 额外上下文

        Returns:
            推理响应，失败则返回 None
        """
        manifest = self._remote_agents.get(role)
        if not manifest or not manifest.url:
            return None

        url = manifest.url.rstrip("/") + manifest.infer_endpoint

        request = AgentInferRequest(
            system_prompt=system_prompt,
            user_message=user_message,
            context=context,
            model=manifest.default_model,
        )

        headers = {"Content-Type": "application/json"}
        if manifest.api_key:
            headers["Authorization"] = f"Bearer {manifest.api_key}"

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(
                    url,
                    json=request.model_dump(exclude_none=True),
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                manifest.last_active_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                return AgentInferResponse(**data)
        except Exception as e:
            logger.warning(f"[AgentRegistry] 调用远程 Agent {role} 失败: {e}")
            # 标记离线
            manifest.is_online = False
            return None

    async def health_check_all(self) -> dict[str, bool]:
        """对所有注册的远程 Agent 执行健康检查。

        Returns:
            {role: is_online} 字典
        """
        results = {}
        for role, manifest in self._remote_agents.items():
            if not manifest.url:
                results[role] = False
                continue

            url = manifest.url.rstrip("/") + manifest.health_endpoint
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    resp = await client.get(url)
                    manifest.is_online = resp.status_code == 200
            except Exception:
                manifest.is_online = False
            results[role] = manifest.is_online

        return results

    # ── 数据库持久化 ──────────────────────────────────────

    async def _save_to_db(self, agent_id: str, role: str, url: str, manifest: AgentManifest) -> None:
        """将 Agent 注册信息保存到数据库。"""
        if not self.db:
            return
        try:
            await self.db.execute(
                text("""
                    INSERT OR REPLACE INTO agent_registry (id, role, url, name, manifest_json, registered_at)
                    VALUES (:id, :role, :url, :name, :manifest, :now)
                """),
                {
                    "id": agent_id,
                    "role": role,
                    "url": url,
                    "name": manifest.name,
                    "manifest": manifest.model_dump_json(),
                    "now": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
            )
            await self.db.commit()
        except Exception as e:
            logger.warning(f"[AgentRegistry] 保存到数据库失败: {e}")

    async def _remove_from_db(self, role: str) -> None:
        """从数据库删除 Agent 注册信息。"""
        if not self.db:
            return
        try:
            await self.db.execute(
                text("DELETE FROM agent_registry WHERE role = :role"),
                {"role": role},
            )
            await self.db.commit()
        except Exception as e:
            logger.warning(f"[AgentRegistry] 从数据库删除失败: {e}")

    async def load_from_db(self) -> None:
        """从数据库加载已注册的远程 Agent。"""
        if not self.db:
            return
        try:
            rows = await self.db.execute(
                text("SELECT role, url, name, manifest_json FROM agent_registry")
            )
            for row in rows.fetchall():
                try:
                    manifest = AgentManifest.model_validate_json(row.manifest_json)
                    manifest.url = row.url
                    self._remote_agents[row.role] = manifest
                    logger.info(f"[AgentRegistry] 从数据库加载远程 Agent: {row.name} ({row.role}) @ {row.url}")
                except Exception as e:
                    logger.warning(f"[AgentRegistry] 解析 manifest 失败: {e}")
        except Exception as e:
            # 表不存在时忽略
            logger.debug(f"[AgentRegistry] 加载数据库失败（首次运行？）: {e}")
