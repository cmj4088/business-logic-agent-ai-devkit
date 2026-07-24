"""认证路由 — M1 认证与安全。

提供注册、登录、刷新、登出、用户信息等 API 端点。
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from shared.errors import ErrorCode, AppException
from .models import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, UserResponse, ApiKeyRequest, ApiKeyResponse,
    UpdateProfileRequest, ChangePasswordRequest,
)
from .auth_service import AuthService
from .middleware import get_current_user
from .security import hash_token

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=dict)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """用户注册。"""
    service = AuthService(db)
    try:
        tokens = await service.register(
            email=request.email,
            password=request.password,
            display_name=request.display_name,
        )
        return {"data": tokens, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """用户登录。"""
    service = AuthService(db)
    try:
        tokens = await service.login(email=request.email, password=request.password)
        return {"data": tokens, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.post("/refresh", response_model=dict)
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """刷新 Token。"""
    service = AuthService(db)
    try:
        tokens = await service.refresh_token(request.refresh_token)
        return {"data": tokens, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.post("/logout")
async def logout(
    req: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """用户登出。"""
    service = AuthService(db)
    # 从请求头获取当前 access token 并撤销
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        await service.logout(token)
    return {"data": {"message": "已登出"}, "error": None, "meta": {"request_id": ""}}


@router.get("/me", response_model=dict)
async def get_me(user: dict = Depends(get_current_user)):
    """获取当前用户信息。"""
    return {"data": user, "error": None, "meta": {"request_id": ""}}


@router.post("/api-keys", response_model=dict)
async def store_api_key(
    request: ApiKeyRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """存储 API Key。"""
    service = AuthService(db)
    try:
        result = await service.store_api_key(user["id"], request.key_name, request.api_key)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.get("/api-keys/{key_name}", response_model=dict)
async def get_api_key(
    key_name: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取 API Key（解密后返回，仅用于测试连接）。"""
    service = AuthService(db)
    key = await service.get_api_key(user["id"], key_name)
    if key is None:
        return {"data": None, "error": {"code": "NOT_FOUND", "message": "未找到该密钥"}, "meta": {"request_id": ""}}
    return {"data": {"key_name": key_name, "exists": True}, "error": None, "meta": {"request_id": ""}}


@router.delete("/api-keys/{key_name}", response_model=dict)
async def delete_api_key(
    key_name: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除 API Key。"""
    service = AuthService(db)
    await service.delete_api_key(user["id"], key_name)
    return {"data": {"message": "已删除"}, "error": None, "meta": {"request_id": ""}}


@router.put("/profile", response_model=dict)
async def update_profile(
    request: UpdateProfileRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新用户资料（显示名称、头像）。"""
    service = AuthService(db)
    try:
        updated = await service.update_profile(
            user["id"],
            display_name=request.display_name,
            avatar=request.avatar,
        )
        return {"data": updated, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.put("/change-password", response_model=dict)
async def change_password(
    request: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改密码。"""
    service = AuthService(db)
    try:
        await service.change_password(user["id"], request.old_password, request.new_password)
        return {"data": {"message": "密码修改成功"}, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}