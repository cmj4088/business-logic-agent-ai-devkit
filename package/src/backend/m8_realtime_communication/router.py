"""M8 实时通信路由。

提供 5 个 WebSocket 通道、1 个 SSE 降级通道和 1 个 Dashboard 聚合端点。
"""

import asyncio
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, Header, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.security import decode_token
from shared.errors import AppException, ErrorCode

from .connection_manager import manager
from .models import WSMessage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["实时通信"])


# ---------------------------------------------------------------------------
# 辅助：从 query param 进行 Token 认证
# ---------------------------------------------------------------------------

async def authenticate_ws_token(
    token: str = Query(..., description="JWT access token"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """从 WebSocket query param 中提取并验证 Token，返回用户信息。

    Args:
        token: URL 查询参数中的 JWT access token。
        db: 数据库会话。

    Returns:
        用户信息字典。

    Raises:
        WebSocketDisconnect: 认证失败时关闭连接。
    """
    try:
        payload = decode_token(token)
    except Exception:
        # 无法直接 raise HTTPException，需要手动关闭 WebSocket
        raise AppException(ErrorCode.AUTH_ERROR, "无效或过期的 Token", status_code=401)

    if payload.get("type") != "access":
        raise AppException(ErrorCode.AUTH_ERROR, "无效的 Token 类型", status_code=401)

    user_id = payload["sub"]

    result = await db.execute(
        text("SELECT id, email, display_name, avatar, created_at FROM users WHERE id = :id"),
        {"id": user_id},
    )
    user = result.fetchone()
    if user is None:
        raise AppException(ErrorCode.NOT_FOUND, "用户不存在", status_code=404)

    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar": user.avatar or "",
        "created_at": user.created_at if isinstance(user.created_at, str) else user.created_at.isoformat() if user.created_at else None,
    }


# ---------------------------------------------------------------------------
# WebSocket 端点
# ---------------------------------------------------------------------------

async def _ws_lifecycle(
    websocket: WebSocket,
    project_id: str | None,
    channel: str,
    token: str,
    db: AsyncSession,
) -> None:
    """WebSocket 连接通用生命周期管理。

    处理认证、连接注册、消息收发、心跳响应和断开清理。
    """
    try:
        user = await authenticate_ws_token(token=token, db=db)
    except AppException as e:
        await websocket.close(code=4001, reason=e.message)
        return

    await manager.connect(websocket, project_id=project_id, channel=channel)

    # 发送欢迎消息
    await manager.send_personal(
        websocket,
        {
            "type": "connected",
            "channel": channel,
            "data": {"user": user["display_name"], "project_id": project_id},
        },
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = WSMessage.model_validate_json(raw)
            except Exception:
                await manager.send_personal(
                    websocket,
                    {"type": "error", "data": {"message": "无效的消息格式"}},
                )
                continue

            # 处理 pong 响应
            if msg.type == "pong":
                continue

            # 处理订阅/取消订阅
            if msg.type == "subscribe":
                logger.info("用户 %s 订阅通道 %s", user["id"], msg.channel)
                await manager.send_personal(
                    websocket,
                    {"type": "subscribed", "channel": msg.channel},
                )
            elif msg.type == "unsubscribe":
                logger.info("用户 %s 取消订阅通道 %s", user["id"], msg.channel)
                await manager.send_personal(
                    websocket,
                    {"type": "unsubscribed", "channel": msg.channel},
                )
            else:
                # 其他消息类型：广播到当前通道
                await manager.broadcast(
                    channel,
                    {
                        "type": msg.type,
                        "channel": channel,
                        "project_id": project_id,
                        "data": msg.data,
                    },
                )

    except WebSocketDisconnect:
        logger.info("WebSocket 客户端断开: channel=%s, project_id=%s", channel, project_id)
    except Exception:
        logger.exception("WebSocket 异常: channel=%s, project_id=%s", channel, project_id)
    finally:
        await manager.disconnect(websocket)


@router.websocket("/ws/agent/{project_id}")
async def ws_agent(
    websocket: WebSocket,
    project_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Agent 思考过程实时通道。"""
    await _ws_lifecycle(websocket, project_id, "agent", token, db)


@router.websocket("/ws/stage/{project_id}")
async def ws_stage(
    websocket: WebSocket,
    project_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """IPD 阶段状态变更通道。"""
    await _ws_lifecycle(websocket, project_id, "stage", token, db)


@router.websocket("/ws/widgets/{project_id}")
async def ws_widgets(
    websocket: WebSocket,
    project_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Widget 实时更新通道。"""
    await _ws_lifecycle(websocket, project_id, "widgets", token, db)


@router.websocket("/ws/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """系统通知推送通道。"""
    await _ws_lifecycle(websocket, None, "notifications", token, db)


@router.websocket("/ws/messages/{round_id}")
async def ws_messages(
    websocket: WebSocket,
    round_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """对话消息实时通道（按对话轮次）。"""
    await _ws_lifecycle(websocket, None, f"messages:{round_id}", token, db)


# ---------------------------------------------------------------------------
# SSE 降级通道
# ---------------------------------------------------------------------------

@router.get("/api/sse/messages/{round_id}")
async def sse_messages(
    round_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """SSE 降级通道：当 WebSocket 不可用时，通过 Server-Sent Events 推送消息。

    Args:
        round_id: 对话轮次 ID。
        token: JWT access token。
        db: 数据库会话。

    Returns:
        StreamingResponse，以 text/event-stream 格式推送事件。
    """
    # 验证 Token
    try:
        user = await authenticate_ws_token(token=token, db=db)
    except AppException:
        # 通过 SSE 返回错误事件
        async def error_stream():
            yield f"event: error\ndata: {json.dumps({'message': '认证失败'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    async def event_stream():
        """SSE 事件生成器，轮询数据库获取 round_id 的新消息。"""
        yield f"event: connected\ndata: {json.dumps({'round_id': round_id, 'user': user['display_name']})}\n\n"

        last_check = 0
        last_message_time = ""
        while True:
            await asyncio.sleep(3)
            current_time = time.time()

            # 每 30 秒发送一次心跳
            if current_time - last_check >= 30:
                yield f": heartbeat\n\n"
                last_check = current_time

            # 查询 round_id 的新消息（轮询间隔 3 秒）
            try:
                sql = text("""
                    SELECT id, sender, recipient, message_type, content,
                           metadata_json, created_at
                    FROM messages
                    WHERE round_id = :round_id
                      AND deleted_at IS NULL
                      AND created_at > :last_time
                    ORDER BY created_at ASC
                """)
                result = await db.execute(sql, {
                    "round_id": round_id,
                    "last_time": last_message_time or "1970-01-01"
                })
                rows = result.fetchall()
                for row in rows:
                    data = {
                        "id": row[0],
                        "sender": row[1],
                        "recipient": row[2],
                        "message_type": row[3],
                        "content": row[4],
                        "metadata": json.loads(row[5]) if row[5] and row[5] != "{}" else {},
                        "created_at": row[6],
                    }
                    yield f"event: message\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
                    last_message_time = row[6] or last_message_time
            except Exception as e:
                logger.warning("SSE 消息轮询异常: %s", e)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Dashboard 聚合端点
# ---------------------------------------------------------------------------

@router.get("/api/dashboard")
async def dashboard(
    token: str = Query(None),
    authorization: str | None = Header(None, alias="Authorization"),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard 聚合端点。

    返回用户信息、待处理事项、最近自动完成事项、项目列表和通知摘要。

    Args:
        token: JWT access token（query param，向后兼容）。
        authorization: Authorization header（Bearer token）。
        db: 数据库会话。

    Returns:
        包含聚合数据的字典。
    """
    # 优先从 Authorization header 提取 token，其次从 query param
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization[7:]
    elif token:
        auth_token = token

    if not auth_token:
        return {
            "data": None,
            "error": {"code": "AUTH_ERROR", "message": "缺少认证 Token"},
            "meta": {"request_id": ""},
        }

    # 验证 Token
    try:
        user = await authenticate_ws_token(token=auth_token, db=db)
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }

    # 查询项目列表
    projects_result = await db.execute(
        text(
            "SELECT id, name, description, complexity_tier, current_stage, status, progress, "
            "created_at, updated_at "
            "FROM projects "
            "WHERE user_id = :user_id AND deleted_at IS NULL "
            "ORDER BY updated_at DESC "
            "LIMIT 10"
        ),
        {"user_id": user["id"]},
    )
    projects = [
        {
            "id": row.id,
            "name": row.name,
            "description": row.description or "",
            "complexity": row.complexity_tier,
            "currentStage": row.current_stage,
            "status": row.status,
            "progress": row.progress or 0,
            "createdAt": row.created_at if isinstance(row.created_at, str) else row.created_at.isoformat() if row.created_at else None,
            "updatedAt": row.updated_at if isinstance(row.updated_at, str) else row.updated_at.isoformat() if row.updated_at else None,
        }
        for row in projects_result.fetchall()
    ]

    # 查询待处理事项
    pending_result = await db.execute(
        text(
            "SELECT id, title, description, priority, type, project_id, project_name, "
            "waiting_since, created_at "
            "FROM pending_items "
            "WHERE user_id = :user_id AND status = 'pending' "
            "ORDER BY created_at ASC "
            "LIMIT 20"
        ),
        {"user_id": user["id"]},
    )
    pending_tasks = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description or "",
            "priority": row.priority or "medium",
            "type": row.type,
            "projectId": row.project_id or "",
            "projectName": row.project_name or "",
            "waitingSince": row.waiting_since or "",
            "createdAt": row.created_at if isinstance(row.created_at, str) else row.created_at.isoformat() if row.created_at else None,
        }
        for row in pending_result.fetchall()
    ]

    # 查询最近自动完成事项
    auto_completed_result = await db.execute(
        text(
            "SELECT id, title, description, type, project_id, project_name, completed_at "
            "FROM pending_items "
            "WHERE user_id = :user_id AND status = 'completed' AND auto_completed = 1 "
            "ORDER BY completed_at DESC "
            "LIMIT 10"
        ),
        {"user_id": user["id"]},
    )
    recent_auto_completed = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description or "",
            "type": row.type,
            "projectId": row.project_id or "",
            "projectName": row.project_name or "",
            "completedAt": row.completed_at if isinstance(row.completed_at, str) else row.completed_at.isoformat() if row.completed_at else None,
        }
        for row in auto_completed_result.fetchall()
    ]

    # 查询通知摘要
    notifications_result = await db.execute(
        text(
            "SELECT id, type, title, message, is_read, created_at "
            "FROM notifications "
            "WHERE user_id = :user_id "
            "ORDER BY created_at DESC "
            "LIMIT 10"
        ),
        {"user_id": user["id"]},
    )
    notifications = [
        {
            "id": row.id,
            "type": row.type,
            "title": row.title,
            "message": row.message or "",
            "read": bool(row.is_read) if row.is_read is not None else False,
            "createdAt": row.created_at if isinstance(row.created_at, str) else row.created_at.isoformat() if row.created_at else None,
        }
        for row in notifications_result.fetchall()
    ]

    unread_count = sum(1 for n in notifications if not n["read"])

    # 构建用户信息（匹配前端 DashboardUser 类型）
    dashboard_user = {
        "name": user.get("display_name", user.get("email", "")),
        "avatar": user.get("avatar", None),
        "role": user.get("email", ""),
    }

    return {
        "data": {
            "user": dashboard_user,
            "pending_tasks": pending_tasks,
            "pending_count": len(pending_tasks),
            "recent_auto_completed": recent_auto_completed,
            "auto_completed_count": len(recent_auto_completed),
            "projects": projects,
            "project_count": len(projects),
            "notifications": notifications,
            "unread_notifications": unread_count,
        },
        "error": None,
        "meta": {"request_id": ""},
    }