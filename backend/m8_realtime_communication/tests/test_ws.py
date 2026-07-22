"""M8 实时通信模块 WebSocket 测试。

测试 WebSocket 连接管理、消息模型和连接池限制。
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from m8_realtime_communication.models import WSMessage
from m8_realtime_communication.connection_manager import ConnectionManager, ConnectionEntry


# ---------------------------------------------------------------------------
# WSMessage 模型测试
# ---------------------------------------------------------------------------

class TestWSMessage:
    """测试 WebSocket 消息模型。"""

    def test_valid_message(self):
        """验证有效的 WSMessage 创建。"""
        msg = WSMessage(
            type="agent_token",
            channel="agent",
            project_id="proj_001",
            data={"token": "hello"},
        )
        assert msg.type == "agent_token"
        assert msg.channel == "agent"
        assert msg.project_id == "proj_001"
        assert msg.data == {"token": "hello"}

    def test_minimal_message(self):
        """验证仅包含必填字段的 WSMessage。"""
        msg = WSMessage(type="ping")
        assert msg.type == "ping"
        assert msg.channel is None
        assert msg.project_id is None
        assert msg.data is None

    def test_json_roundtrip(self):
        """验证 WSMessage 的 JSON 序列化/反序列化。"""
        original = WSMessage(
            type="notification",
            channel="notifications",
            data={"title": "测试通知", "body": "内容"},
        )
        json_str = original.model_dump_json()
        parsed = WSMessage.model_validate_json(json_str)
        assert parsed.type == original.type
        assert parsed.channel == original.channel
        assert parsed.data == original.data

    def test_invalid_type_field(self):
        """验证缺少必填字段时抛出异常。"""
        with pytest.raises(ValueError):
            WSMessage()  # type 是必填字段


# ---------------------------------------------------------------------------
# ConnectionManager 测试
# ---------------------------------------------------------------------------

class TestConnectionManager:
    """测试 WebSocket 连接管理器。"""

    @pytest.fixture
    def mock_websocket(self):
        """创建模拟的 WebSocket 连接。"""
        ws = AsyncMock()
        ws.client_state = MagicMock()
        ws.client_state.DISCONNECTED = "DISCONNECTED"
        ws.client_state.CONNECTED = "CONNECTED"
        from starlette.websockets import WebSocketState
        ws.client_state = WebSocketState.CONNECTED
        ws.send_text = AsyncMock()
        ws.send_json = AsyncMock()
        ws.accept = AsyncMock()
        ws.close = AsyncMock()
        return ws

    @pytest.fixture
    def manager(self):
        """创建连接管理器实例。"""
        mgr = ConnectionManager()
        mgr._connections = []
        mgr._heartbeat_task = None
        return mgr

    @pytest.mark.asyncio
    async def test_connect_and_disconnect(self, manager, mock_websocket):
        """测试连接建立和断开。"""
        # 建立连接
        await manager.connect(mock_websocket, project_id="proj_001", channel="agent")
        assert len(manager._connections) == 1
        assert manager._connections[0].project_id == "proj_001"
        assert manager._connections[0].channel == "agent"
        mock_websocket.accept.assert_called_once()

        # 断开连接
        await manager.disconnect(mock_websocket)
        assert len(manager._connections) == 0

    @pytest.mark.asyncio
    async def test_max_connections_limit(self, manager, mock_websocket):
        """测试达到最大连接数后拒绝新连接。"""
        from starlette.websockets import WebSocketState

        manager.max_connections = 2

        ws1 = mock_websocket
        ws2 = AsyncMock()
        ws2.client_state = WebSocketState.CONNECTED
        ws2.send_text = AsyncMock()
        ws2.send_json = AsyncMock()
        ws2.accept = AsyncMock()
        ws2.close = AsyncMock()

        ws3 = AsyncMock()
        ws3.client_state = WebSocketState.CONNECTED
        ws3.send_text = AsyncMock()
        ws3.send_json = AsyncMock()
        ws3.accept = AsyncMock()
        ws3.close = AsyncMock()

        await manager.connect(ws1, project_id="p1", channel="c1")
        await manager.connect(ws2, project_id="p2", channel="c2")
        assert len(manager._connections) == 2

        # 第三个连接应被拒绝
        from shared.errors import AppException
        with pytest.raises(AppException):
            await manager.connect(ws3, project_id="p3", channel="c3")

        assert len(manager._connections) == 2
        ws3.close.assert_called()

    @pytest.mark.asyncio
    async def test_broadcast_to_channel(self, manager, mock_websocket):
        """测试向指定通道广播消息。"""
        from starlette.websockets import WebSocketState

        ws2 = AsyncMock()
        ws2.client_state = WebSocketState.CONNECTED
        ws2.send_text = AsyncMock()
        ws2.send_json = AsyncMock()
        ws2.accept = AsyncMock()
        ws2.close = AsyncMock()

        await manager.connect(mock_websocket, project_id="p1", channel="agent")
        await manager.connect(ws2, project_id="p2", channel="stage")

        message = {"type": "update", "data": {"key": "value"}}
        await manager.broadcast("agent", message)

        # 只有 agent 通道的连接收到消息
        mock_websocket.send_text.assert_called_once()
        ws2.send_text.assert_not_called()

        # 验证消息内容
        sent = mock_websocket.send_text.call_args[0][0]
        parsed = json.loads(sent)
        assert parsed["type"] == "update"
        assert parsed["data"] == {"key": "value"}

    @pytest.mark.asyncio
    async def test_send_to_project(self, manager, mock_websocket):
        """测试向指定项目发送消息。"""
        from starlette.websockets import WebSocketState

        ws2 = AsyncMock()
        ws2.client_state = WebSocketState.CONNECTED
        ws2.send_text = AsyncMock()
        ws2.send_json = AsyncMock()
        ws2.accept = AsyncMock()
        ws2.close = AsyncMock()

        await manager.connect(mock_websocket, project_id="proj_a", channel="agent")
        await manager.connect(ws2, project_id="proj_b", channel="stage")

        message = {"type": "stage_update", "data": {"stage": "concept"}}
        await manager.send_to_project("proj_a", message)

        # 只有 proj_a 的连接收到消息
        mock_websocket.send_text.assert_called_once()
        ws2.send_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_personal(self, manager, mock_websocket):
        """测试向单个连接发送消息。"""
        await manager.connect(mock_websocket, project_id="proj_001", channel="agent")

        message = {"type": "welcome", "data": {"user": "test"}}
        await manager.send_personal(mock_websocket, message)

        mock_websocket.send_text.assert_called_once()
        sent = mock_websocket.send_text.call_args[0][0]
        parsed = json.loads(sent)
        assert parsed == message

    @pytest.mark.asyncio
    async def test_heartbeat_cleans_dead_connections(self, manager, mock_websocket):
        """测试心跳检测清理已断开连接。"""
        from starlette.websockets import WebSocketState

        await manager.connect(mock_websocket, project_id="p1", channel="agent")
        assert len(manager._connections) == 1

        # 模拟连接断开
        mock_websocket.client_state = WebSocketState.DISCONNECTED

        # 手动触发一次心跳清理
        import asyncio
        manager.heartbeat_interval = 0.1
        manager._heartbeat_task = asyncio.create_task(manager._heartbeat_loop())

        await asyncio.sleep(0.3)

        # 死连接应被清理
        assert len(manager._connections) == 0

        manager._heartbeat_task.cancel()
        try:
            await manager._heartbeat_task
        except asyncio.CancelledError:
            pass