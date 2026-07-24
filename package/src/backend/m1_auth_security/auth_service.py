"""认证业务逻辑 — M1 认证与安全。

处理用户注册、登录、Token 刷新、登出等核心业务。
"""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import ErrorCode, AppException
from shared.validators import validate_email, validate_password
from .security import (
    hash_password, verify_password,
    generate_user_id, generate_session_id, generate_secret_id,
    create_access_token, create_refresh_token,
    decode_token, hash_token,
    encrypt_api_key, decrypt_api_key,
)


class AuthService:
    """认证服务。"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, email: str, password: str, display_name: str = "") -> dict:
        """用户注册。"""
        # 校验输入
        email_error = validate_email(email)
        if email_error:
            raise AppException(ErrorCode.VALIDATION_ERROR, email_error, status_code=422)

        password_error = validate_password(password)
        if password_error:
            raise AppException(ErrorCode.VALIDATION_ERROR, password_error, status_code=422)

        # 检查邮箱是否已注册
        result = await self.db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        )
        if result.fetchone() is not None:
            raise AppException(ErrorCode.CONFLICT, "该邮箱已被注册", status_code=409)

        # 创建用户
        user_id = generate_user_id()
        password_hash = hash_password(password)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        await self.db.execute(
            text("""INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
                    VALUES (:id, :email, :password_hash, :display_name, :created_at, :updated_at)"""),
            {
                "id": user_id,
                "email": email,
                "password_hash": password_hash,
                "display_name": display_name or email.split("@")[0],
                "created_at": now,
                "updated_at": now,
            }
        )
        await self.db.commit()

        # 生成 Token
        return await self._generate_tokens(user_id)

    async def login(self, email: str, password: str) -> dict:
        """用户登录。"""
        # 查找用户
        result = await self.db.execute(
            text("SELECT id, email, password_hash, display_name FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()
        if user is None:
            raise AppException(ErrorCode.AUTH_ERROR, "邮箱或密码错误", status_code=401)

        # 验证密码
        if not verify_password(password, user.password_hash):
            raise AppException(ErrorCode.AUTH_ERROR, "邮箱或密码错误", status_code=401)

        return await self._generate_tokens(user.id)

    async def refresh_token(self, refresh_token: str) -> dict:
        """刷新 Session Token。"""
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise AppException(ErrorCode.AUTH_ERROR, "无效的 Refresh Token", status_code=401)
        except Exception:
            raise AppException(ErrorCode.AUTH_ERROR, "无效或过期的 Refresh Token", status_code=401)

        user_id = payload["sub"]
        # 验证用户存在
        result = await self.db.execute(
            text("SELECT id FROM users WHERE id = :id"),
            {"id": user_id}
        )
        if result.fetchone() is None:
            raise AppException(ErrorCode.NOT_FOUND, "用户不存在", status_code=404)

        return await self._generate_tokens(user_id)

    async def logout(self, access_token: str) -> None:
        """用户登出，将 Token 加入黑名单。"""
        token_hash = hash_token(access_token)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        await self.db.execute(
            text("""UPDATE sessions SET revoked_at = :revoked_at
                    WHERE token_hash = :token_hash AND revoked_at IS NULL"""),
            {"token_hash": token_hash, "revoked_at": now}
        )
        await self.db.commit()

    async def get_current_user(self, user_id: str) -> dict | None:
        """获取当前用户信息。"""
        result = await self.db.execute(
            text("SELECT id, email, display_name, avatar, created_at, updated_at FROM users WHERE id = :id"),
            {"id": user_id}
        )
        user = result.fetchone()
        if user is None:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "avatar": user.avatar or "",
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    async def store_api_key(self, user_id: str, key_name: str, api_key: str) -> dict:
        """加密存储 API Key。"""
        encrypted = encrypt_api_key(api_key)
        secret_id = generate_secret_id()
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        await self.db.execute(
            text("""INSERT INTO secrets (id, user_id, key_name, encrypted_value, created_at)
                    VALUES (:id, :user_id, :key_name, :encrypted_value, :created_at)"""),
            {
                "id": secret_id,
                "user_id": user_id,
                "key_name": key_name,
                "encrypted_value": encrypted,
                "created_at": now,
            }
        )
        await self.db.commit()

        return {"id": secret_id, "key_name": key_name, "created_at": now}

    async def get_api_key(self, user_id: str, key_name: str) -> str | None:
        """获取并解密 API Key。"""
        result = await self.db.execute(
            text("""SELECT encrypted_value FROM secrets
                    WHERE user_id = :user_id AND key_name = :key_name AND deleted_at IS NULL
                    ORDER BY created_at DESC LIMIT 1"""),
            {"user_id": user_id, "key_name": key_name}
        )
        row = result.fetchone()
        if row is None:
            return None
        return decrypt_api_key(row.encrypted_value)

    async def update_profile(self, user_id: str, display_name: str = "", avatar: str = "") -> dict:
        """更新用户资料。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        updates = []
        params = {"id": user_id, "updated_at": now}

        if display_name:
            updates.append("display_name = :display_name")
            params["display_name"] = display_name
        if avatar:
            updates.append("avatar = :avatar")
            params["avatar"] = avatar

        if updates:
            updates.append("updated_at = :updated_at")
            await self.db.execute(
                text(f"UPDATE users SET {', '.join(updates)} WHERE id = :id"),
                params,
            )
            await self.db.commit()

        return await self.get_current_user(user_id)

    async def change_password(self, user_id: str, old_password: str, new_password: str) -> None:
        """修改密码。"""
        # 验证旧密码
        result = await self.db.execute(
            text("SELECT password_hash FROM users WHERE id = :id"),
            {"id": user_id},
        )
        user = result.fetchone()
        if user is None:
            raise AppException(ErrorCode.NOT_FOUND, "用户不存在", status_code=404)

        if not verify_password(old_password, user.password_hash):
            raise AppException(ErrorCode.AUTH_ERROR, "旧密码不正确", status_code=401)

        # 校验新密码
        password_error = validate_password(new_password)
        if password_error:
            raise AppException(ErrorCode.VALIDATION_ERROR, password_error, status_code=422)

        # 更新密码
        new_hash = hash_password(new_password)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("UPDATE users SET password_hash = :hash, updated_at = :updated_at WHERE id = :id"),
            {"id": user_id, "hash": new_hash, "updated_at": now},
        )
        await self.db.commit()

    async def delete_api_key(self, user_id: str, key_name: str) -> None:
        """软删除 API Key。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE secrets SET deleted_at = :deleted_at
                    WHERE user_id = :user_id AND key_name = :key_name AND deleted_at IS NULL"""),
            {"user_id": user_id, "key_name": key_name, "deleted_at": now}
        )
        await self.db.commit()

    async def _generate_tokens(self, user_id: str) -> dict:
        """生成 Token 对并存储到数据库。"""
        settings = __import__("shared.config", fromlist=["get_settings"]).get_settings()

        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)

        # 存储 session（access token 哈希）
        session_id = generate_session_id()
        token_hash = hash_token(access_token)
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=settings.session_token_expire_minutes)).strftime("%Y-%m-%d %H:%M:%S")
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        await self.db.execute(
            text("""INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
                    VALUES (:id, :user_id, :token_hash, :expires_at, :created_at)"""),
            {
                "id": session_id,
                "user_id": user_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
                "created_at": now,
            }
        )
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.session_token_expire_minutes * 60,
        }