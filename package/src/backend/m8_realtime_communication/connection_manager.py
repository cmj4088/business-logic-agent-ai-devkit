"""WebSocket 连接管理器 — M8 实时通信。

管理 WebSocket 连接池，支持心跳检测、广播与按项目发送。
"""

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from shared.config import get_settings
from shared.errors import AppException, ErrorCode

logger = logging.getLogger(__name__)


class ConnectionEntry:
    """单条连接记录，包含 WebSocket 实例和元数据。"""

    def __init__(self, websocket: WebSocket, project_id: str | None, channel: str | None):
        self.websocket = websocket
        self.project_id = project_id
        self.channel = channel
        self.last_pong: float = asyncio.get_event_loop().time()


class ConnectionManager:
    """WebSocket 连接管理器。

    Attributes:
        max_connections: 最大并发连接数，从配置读取。
        heartbeat_interval: 心跳间隔（秒），从配置读取。
    """

    def __init__(self):
        settings = get_settings()
        self.max_connections: int = settings.ws_max_connections
        self.heartbeat_interval: int = settings.ws_heartbeat_interval
        self._connections: list[ConnectionEntry] = []
        self._heartbeat_task: asyncio.Task | None = None
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # 连接管理
    # ------------------------------------------------------------------

    async def connect(
        self, websocket: WebSocket, project_id: str | None = None, channel: str | None = None
    ) -> None:
        """接受 WebSocket 连接并注册到连接池。

        Args:
            websocket: WebSocket 连接实例。
            project_id: 关联的项目 ID，可选。
            channel: 关联的通道名称，可选。

        Raises:
            AppException: 连接数达到上限时抛出。
        """
        async with self._lock:
            if len(self._connections) >= self.max_connections:
                await websocket.close(code=1013, reason="连接数已达上限")
                raise AppException(
                    ErrorCode.FORBIDDEN,
                    f"连接数已达上限 ({self.max_connections})",
                    status_code=503,
                )

            await websocket.accept()
            entry = ConnectionEntry(websocket, project_id, channel)
            self._connections.append(entry)
            logger.info(
                "WebSocket 已连接: project_id=%s, channel=%s, 当前连接数=%d",
                project_id, channel, len(self._connections),
            )

        # 启动心跳任务（仅首次）
        if self._heartbeat_task is None or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def disconnect(self, websocket: WebSocket) -> None:
        """从连接池中移除指定连接。

        Args:
            websocket: 要断开的 WebSocket 连接实例。
        """
        async with self._lock:
            before = len(self._connections)
            self._connections = [
                e for e in self._connections if e.websocket is not websocket
            ]
            removed = before - len(self._connections)
            if removed > 0:
                logger.info(
                    "WebSocket 已断开, 当前连接数=%d", len(self._connections)
                )

        # 安全关闭
        if websocket.client_state != WebSocketState.DISCONNECTED:
            try:
                await websocket.close()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # 消息发送
    # ------------------------------------------------------------------

    async def broadcast(self, channel: str, message: dict[str, Any]) -> None:
        """向指定通道内所有连接广播消息。

        Args:
            channel: 目标通道名称。
            message: 要发送的消息字典。
        """
        payload = json.dumps(message, ensure_ascii=False)
        tasks = []
        for entry in self._connections:
            if entry.channel == channel:
                tasks.append(self._safe_send(entry.websocket, payload))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_project(self, project_id: str, message: dict[str, Any]) -> None:
        """向指定项目的所有连接发送消息。

        Args:
            project_id: 目标项目 ID。
            message: 要发送的消息字典。
        """
        payload = json.dumps(message, ensure_ascii=False)
        tasks = []
        for entry in self._connections:
            if entry.project_id == project_id:
                tasks.append(self._safe_send(entry.websocket, payload))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_personal(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        """向单个 WebSocket 连接发送消息。

        Args:
            websocket: 目标 WebSocket 连接。
            message: 要发送的消息字典。
        """
        payload = json.dumps(message, ensure_ascii=False)
        await self._safe_send(websocket, payload)

    # ------------------------------------------------------------------
    # 心跳
    # ------------------------------------------------------------------

    async def _heartbeat_loop(self) -> None:
        """后台心跳循环，每 30 秒发送 ping 并检查 pong 响应。"""
        while True:
            await asyncio.sleep(self.heartbeat_interval)

            now = asyncio.get_event_loop().time()
            dead: list[ConnectionEntry] = []

            async with self._lock:
                for entry in self._connections:
                    if entry.websocket.client_state == WebSocketState.DISCONNECTED:
                        dead.append(entry)
                        continue
                    try:
                        await entry.websocket.send_json({"type": "ping"})
                    except Exception:
                        dead.append(entry)

                # 移除已断开或超时的连接
                for entry in dead:
                    self._connections.remove(entry)
                    logger.info("心跳检测: 移除死连接, 当前连接数=%d", len(self._connections))

            if dead:
                logger.info("心跳检测: 清理了 %d 个死连接", len(dead))

    # ------------------------------------------------------------------
    # 内部辅助
    # ------------------------------------------------------------------

    async def _safe_send(self, websocket: WebSocket, payload: str) -> None:
        """安全发送消息，忽略已断开连接的错误。

        Args:
            websocket: 目标 WebSocket 连接。
            payload: JSON 字符串。
        """
        try:
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.send_text(payload)
        except Exception:
            await self.disconnect(websocket)


# 全局单例
manager = ConnectionManager()