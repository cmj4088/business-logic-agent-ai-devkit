"""认证中间件 — M1 认证与安全。

提供 Bearer Token 提取和验证的 FastAPI 依赖注入。
"""
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import ErrorCode, AppException
from m0_infrastructure.database import get_db
from .security import decode_token, hash_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """从请求中提取并验证当前用户。

    用作 FastAPI 依赖注入：
        @app.get("/api/protected")
        async def protected(user: dict = Depends(get_current_user)):
            ...
    """
    if credentials is None:
        raise AppException(ErrorCode.AUTH_ERROR, "未提供认证凭据", status_code=401)

    token = credentials.credentials

    # 解码 JWT
    try:
        payload = decode_token(token)
    except Exception:
        raise AppException(ErrorCode.AUTH_ERROR, "无效或过期的 Token", status_code=401)

    if payload.get("type") != "access":
        raise AppException(ErrorCode.AUTH_ERROR, "无效的 Token 类型", status_code=401)

    # 检查 Token 是否已被撤销
    token_hash_val = hash_token(token)
    result = await db.execute(
        text("SELECT id FROM sessions WHERE token_hash = :token_hash AND revoked_at IS NOT NULL"),
        {"token_hash": token_hash_val}
    )
    if result.fetchone() is not None:
        raise AppException(ErrorCode.AUTH_ERROR, "Token 已被撤销", status_code=401)

    user_id = payload["sub"]

    # 查询用户
    result = await db.execute(
        text("SELECT id, email, display_name, avatar, created_at, updated_at FROM users WHERE id = :id"),
        {"id": user_id}
    )
    user = result.fetchone()
    if user is None:
        raise AppException(ErrorCode.NOT_FOUND, "用户不存在", status_code=404)

    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "avatar": user.avatar or "",
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }