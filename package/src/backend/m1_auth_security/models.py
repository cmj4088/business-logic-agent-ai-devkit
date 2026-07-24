"""Pydantic 请求/响应模型 — M1 认证与安全。"""
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """注册请求。"""
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., min_length=8, description="密码（至少 8 位）")
    display_name: str = Field(default="", max_length=50, description="显示名称")


class LoginRequest(BaseModel):
    """登录请求。"""
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., description="密码")


class TokenResponse(BaseModel):
    """Token 响应。"""
    access_token: str = Field(..., description="Session Token")
    refresh_token: str = Field(..., description="Refresh Token")
    token_type: str = Field(default="bearer", description="Token 类型")
    expires_in: int = Field(..., description="过期时间（秒）")


class RefreshRequest(BaseModel):
    """Token 刷新请求。"""
    refresh_token: str = Field(..., description="Refresh Token")


class UserResponse(BaseModel):
    """用户信息响应。"""
    id: str = Field(..., description="用户 ID")
    email: str = Field(..., description="邮箱")
    display_name: str = Field(..., description="显示名称")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")


class ApiKeyRequest(BaseModel):
    """API Key 存储请求。"""
    key_name: str = Field(..., description="密钥名称（如 anthropic、openai）")
    api_key: str = Field(..., description="API Key 值")


class ApiKeyResponse(BaseModel):
    """API Key 响应。"""
    id: str = Field(..., description="密钥 ID")
    key_name: str = Field(..., description="密钥名称")
    created_at: str = Field(..., description="创建时间")


class UpdateProfileRequest(BaseModel):
    """更新用户资料请求。"""
    display_name: str = Field(default="", max_length=50, description="显示名称")
    avatar: str = Field(default="", max_length=200000, description="头像 Base64 或 URL（200×200 JPEG 约 10-30KB base64）")


class ChangePasswordRequest(BaseModel):
    """修改密码请求。"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=8, description="新密码（至少 8 位）")