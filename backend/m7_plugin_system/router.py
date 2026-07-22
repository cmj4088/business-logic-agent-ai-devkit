"""插件路由 — M7 插件系统。

提供插件安装、配置、启用/禁用、卸载、测试等 API 端点。
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from shared.errors import ErrorCode, AppException
from .models import (
    PluginInstallRequest,
    PluginConfigUpdateRequest,
    PluginToggleRequest,
    AgentPluginRequest,
)
from .plugin_service import PluginService

router = APIRouter(prefix="/api/plugins", tags=["插件"])


# === 已安装插件管理 ===


@router.get("", response_model=dict)
async def list_plugins(
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取已安装的插件列表。"""
    service = PluginService(db)
    try:
        plugins = await service.list_plugins()
        return {
            "data": plugins,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.get("/available", response_model=dict)
async def get_available_plugins(
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取可用插件市场列表。"""
    service = PluginService(db)
    try:
        plugins = await service.get_available_plugins()
        return {
            "data": plugins,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.post("/install", response_model=dict)
async def install_plugin(
    request: Request,
    body: PluginInstallRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """安装插件。"""
    service = PluginService(db)
    try:
        plugin = await service.install_plugin(body.plugin_id, body.config)
        return {
            "data": plugin,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.get("/{plugin_id}", response_model=dict)
async def get_plugin(
    plugin_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取插件详情。"""
    service = PluginService(db)
    try:
        plugin = await service.get_plugin(plugin_id)
        if plugin is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"插件 '{plugin_id}' 未安装",
                status_code=404,
            )
        return {
            "data": plugin,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.put("/{plugin_id}", response_model=dict)
async def update_plugin(
    plugin_id: str,
    request: Request,
    body: PluginConfigUpdateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新插件配置。"""
    service = PluginService(db)
    try:
        plugin = await service.update_plugin(
            plugin_id,
            config=body.config if body.config else None,
            enabled=body.enabled,
        )
        return {
            "data": plugin,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.delete("/{plugin_id}", response_model=dict)
async def uninstall_plugin(
    plugin_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """卸载插件。"""
    service = PluginService(db)
    try:
        await service.uninstall_plugin(plugin_id)
        return {
            "data": {"message": "插件已卸载", "plugin_id": plugin_id},
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.post("/{plugin_id}/toggle", response_model=dict)
async def toggle_plugin(
    plugin_id: str,
    request: Request,
    body: PluginToggleRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """启用/禁用插件。"""
    service = PluginService(db)
    try:
        plugin = await service.toggle_plugin(plugin_id, body.enabled)
        return {
            "data": plugin,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.post("/{plugin_id}/test", response_model=dict)
async def test_plugin(
    plugin_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """测试插件连接。"""
    service = PluginService(db)
    try:
        result = await service.test_plugin(plugin_id)
        return {
            "data": result,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


# === Agent 插件分配 ===


@router.get("/agent/{agent_role}", response_model=dict)
async def get_agent_plugins(
    agent_role: str,
    request: Request,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取指定 Agent 角色已分配的插件列表。"""
    service = PluginService(db)
    try:
        plugins = await service.get_agent_plugins(agent_role)
        return {
            "data": plugins,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }


@router.post("/agent/{agent_role}", response_model=dict)
async def set_agent_plugins(
    agent_role: str,
    request: Request,
    body: AgentPluginRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """设置指定 Agent 角色的插件分配。"""
    service = PluginService(db)
    try:
        plugins = await service.set_agent_plugins(agent_role, body.plugin_ids)
        return {
            "data": plugins,
            "error": None,
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": getattr(request.state, "request_id", "")},
        }