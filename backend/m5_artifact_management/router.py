"""产出物管理路由 — M5。

提供产出物的 CRUD API 端点及版本管理。
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from shared.errors import AppException
from .models import ArtifactCreateRequest, ArtifactUpdateRequest
from .artifact_service import ArtifactService

router = APIRouter(prefix="/api/artifacts", tags=["产出物管理"])

# 18 种产出物类型定义
ARTIFACT_TYPES = [
    {"key": "mrd", "name": "市场需求文档 (MRD)", "description": "市场需求和客户分析"},
    {"key": "prd", "name": "产品需求文档 (PRD)", "description": "产品功能和规格定义"},
    {"key": "business_case", "name": "商业论证", "description": "项目商业价值与可行性分析"},
    {"key": "competitive_analysis", "name": "竞品分析报告", "description": "竞争产品对比分析"},
    {"key": "customer_needs", "name": "客户需求文档", "description": "客户需求调研与整理"},
    {"key": "system_design", "name": "系统架构设计", "description": "系统整体架构设计文档"},
    {"key": "bom", "name": "物料清单 (BOM)", "description": "产品物料与成本估算"},
    {"key": "risk_assessment", "name": "风险评估报告", "description": "项目风险评估与缓解计划"},
    {"key": "detailed_design", "name": "详细设计文档", "description": "模块详细设计说明"},
    {"key": "unit_test", "name": "单元测试报告", "description": "单元测试执行与结果"},
    {"key": "test_cases", "name": "测试用例集", "description": "功能与集成测试用例"},
    {"key": "system_test", "name": "系统测试报告", "description": "系统级测试执行与结果"},
    {"key": "tr_review", "name": "TR 评审报告", "description": "技术评审 (TR3/TR4/TR5/TR6) 报告"},
    {"key": "gtm_plan", "name": "GTM 执行计划", "description": "产品上市执行计划"},
    {"key": "production_report", "name": "首批生产报告", "description": "首批生产质量与进度报告"},
    {"key": "ops_review", "name": "运营评审报告", "description": "生命周期运营评审"},
    {"key": "iteration_plan", "name": "迭代需求清单", "description": "产品迭代需求与路线图"},
    {"key": "gate_materials", "name": "门禁材料", "description": "阶段门禁审批材料汇总"},
]


@router.get("/types")
async def get_artifact_types():
    """获取产出物类型列表（18 种）。"""
    return {"data": ARTIFACT_TYPES, "error": None, "meta": {"request_id": ""}}


@router.get("")
async def list_artifacts(
    project_id: str = Query(..., description="项目 ID"),
    stage: str | None = Query(None, description="所属阶段"),
    type: str | None = Query(None, description="产出物类型"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """按项目、阶段和类型筛选产出物列表。"""
    service = ArtifactService(db)
    try:
        artifacts = await service.list_artifacts(project_id, stage, type)
        return {"data": artifacts, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.post("")
async def create_artifact(
    request: ArtifactCreateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建产出物。"""
    service = ArtifactService(db)
    try:
        artifact = await service.create_artifact(
            project_id=request.project_id,
            artifact_type=request.artifact_type,
            name=request.name,
            content=request.content,
            stage=request.stage,
        )
        return {"data": artifact, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.get("/{artifact_id}")
async def get_artifact(
    artifact_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取产出物详情。"""
    service = ArtifactService(db)
    try:
        artifact = await service.get_artifact(artifact_id)
        return {"data": artifact, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.put("/{artifact_id}")
async def update_artifact(
    artifact_id: str,
    request: ArtifactUpdateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新产出物（创建新版本）。"""
    service = ArtifactService(db)
    try:
        artifact = await service.update_artifact(
            artifact_id=artifact_id,
            content=request.content,
            change_summary=request.change_summary,
        )
        return {"data": artifact, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.delete("/{artifact_id}")
async def delete_artifact(
    artifact_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """软删除产出物。"""
    service = ArtifactService(db)
    try:
        await service.delete_artifact(artifact_id)
        return {"data": {"message": "已删除", "id": artifact_id}, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.get("/{artifact_id}/versions")
async def get_versions(
    artifact_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取产出物版本历史。"""
    service = ArtifactService(db)
    try:
        versions = await service.get_versions(artifact_id)
        return {"data": versions, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


@router.get("/{artifact_id}/versions/{version}")
async def get_version(
    artifact_id: str,
    version: int,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取产出物特定版本。"""
    service = ArtifactService(db)
    try:
        version_data = await service.get_version(artifact_id, version)
        return {"data": version_data, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {"data": None, "error": {"code": e.code.value, "message": e.message}, "meta": {"request_id": ""}}


# === 附件管理端点 ===


@router.put("/{artifact_id}/attachments")
async def upload_attachment(
    artifact_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传附件到产出物。"""
    from fastapi import UploadFile, File, Form
    # MVP 阶段：附件上传需要 multipart/form-data，此处提供基本端点
    return {
        "data": {
            "message": "附件上传功能（MVP 阶段通过 Electron IPC 处理文件系统操作）",
            "artifact_id": artifact_id,
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.delete("/{artifact_id}/attachments/{attachment_id}")
async def delete_attachment(
    artifact_id: str,
    attachment_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除产出物附件。"""
    return {
        "data": {"message": "附件已删除", "artifact_id": artifact_id, "attachment_id": attachment_id},
        "error": None,
        "meta": {"request_id": ""},
    }