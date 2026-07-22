"""安全工具 — M1 认证与安全。

提供 Fernet 加解密、bcrypt 密码哈希、JWT 签发/验证功能。
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from cryptography.fernet import Fernet

from shared.config import get_settings


def hash_password(password: str) -> str:
    """使用 bcrypt 对密码进行哈希。"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """验证密码是否匹配 bcrypt 哈希。"""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def generate_user_id() -> str:
    """生成用户唯一 ID。"""
    return f"user_{uuid.uuid4().hex[:12]}"


def generate_session_id() -> str:
    """生成会话唯一 ID。"""
    return f"sess_{uuid.uuid4().hex[:12]}"


def generate_secret_id() -> str:
    """生成密钥唯一 ID。"""
    return f"sec_{uuid.uuid4().hex[:12]}"


def create_access_token(user_id: str) -> str:
    """创建短期 Session Token（15 分钟有效）。"""
    settings = get_settings()
    payload = {
        "sub": user_id,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.session_token_expire_minutes),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """创建长期 Refresh Token（30 天有效）。"""
    settings = get_settings()
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """解码并验证 JWT Token。"""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def hash_token(token: str) -> str:
    """对 token 进行 SHA256 哈希（用于存储到 sessions 表）。"""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_fernet() -> Fernet:
    """获取 Fernet 加密实例。"""
    settings = get_settings()
    key = settings.fernet_key.encode("utf-8") if settings.fernet_key else Fernet.generate_key()
    return Fernet(key)


def encrypt_api_key(api_key: str) -> str:
    """使用 Fernet 加密 API Key。"""
    f = get_fernet()
    return f.encrypt(api_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted: str) -> str:
    """使用 Fernet 解密 API Key。"""
    f = get_fernet()
    return f.decrypt(encrypted.encode("utf-8")).decode("utf-8")