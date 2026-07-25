"""Standalone Agent — 独立部署的智能体服务。

每个 IPD 角色可以作为独立的微服务运行，通过 HTTP API 与主引擎通信。
支持通过 URL 注册和发现机制，实现分布式 Agent 编排。

使用方式：
    cd backend
    python -m standalone_agent.runner --role product_manager --port 8001

    # 注册到主引擎
    POST /api/agents/registry
    {"role": "product_manager", "url": "http://localhost:8001", "name": "产品经理小王"}
"""
import os
import sys

# 自动修正 PYTHONPATH，使 standalone_agent 可以直接从 backend/ 目录运行
_current = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_current)
_root = os.path.dirname(_backend)
for p in [_root, _backend]:
    if p not in sys.path:
        sys.path.insert(0, p)

from .manifest import AgentManifest, AgentCapability
from .registry import AgentRegistryClient

__all__ = ["AgentManifest", "AgentCapability", "AgentRegistryClient"]
