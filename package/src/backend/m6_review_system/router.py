"""审核路由 — M6 审核系统。

提供审核列表、详情、投票、批量审核、升级、仪表盘、遗留问题等 API 端点。
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from shared.errors import AppException

from .models import VoteRequest, BatchReviewRequest, EscalateRequest
from .review_service import ReviewService

router = APIRouter(prefix="/api/reviews", tags=["审核"])


# ------------------------------------------------------------------
# GET /api/reviews - 审核列表
# ------------------------------------------------------------------

@router.get("")
async def list_reviews(
    project_id: str | None = Query(None, description="按项目 ID 过滤"),
    status: str | None = Query(None, description="按状态过滤 pending/approved/rejected"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取审核任务列表。"""
    service = ReviewService(db)
    try:
        result = await service.list_reviews(project_id=project_id, status=status)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# GET /api/reviews/dashboard - 审核仪表盘
# ------------------------------------------------------------------

@router.get("/dashboard")
async def get_dashboard(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取审核仪表盘聚合数据。"""
    service = ReviewService(db)
    try:
        result = await service.get_dashboard()
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# GET /api/reviews/history - 审核历史（必须在动态路由 {review_id} 之前定义）
# ------------------------------------------------------------------

@router.get("/history")
async def get_review_history(
    project_id: str | None = Query(None, description="按项目 ID 过滤"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取审核历史记录。"""
    service = ReviewService(db)
    try:
        result = await service.list_reviews(project_id=project_id)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# GET /api/reviews/issues - 遗留问题列表（必须在动态路由 {review_id} 之前定义）
# ------------------------------------------------------------------

@router.get("/issues")
async def get_issues(
    project_id: str | None = Query(None, description="按项目 ID 过滤"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取遗留问题列表。"""
    service = ReviewService(db)
    try:
        result = await service.get_issues(project_id=project_id)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# GET /api/reviews/{review_id} - 审核详情
# ------------------------------------------------------------------

@router.get("/{review_id}")
async def get_review(
    review_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取审核详情，包含投票记录和关联问题。"""
    service = ReviewService(db)
    try:
        result = await service.get_review(review_id)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# POST /api/reviews/{review_id}/vote - 提交投票
# ------------------------------------------------------------------

@router.post("/{review_id}/vote")
async def submit_vote(
    review_id: str,
    request: VoteRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交门禁投票。

    单人模式下所有投票自动通过，标注 auto_approved_due_to_single_user_mode。
    """
    service = ReviewService(db)
    try:
        # 先通过 review_id 获取审核任务，从中提取 project_id 和 gate_id
        from sqlalchemy import text
        task_result = await db.execute(
            text("SELECT project_id, gate_id FROM review_tasks WHERE id = :id"),
            {"id": review_id},
        )
        task = task_result.fetchone()
        if task is None:
            return {
                "data": None,
                "error": {"code": "NOT_FOUND", "message": "审核任务不存在"},
                "meta": {"request_id": ""},
            }

        result = await service.submit_vote(
            project_id=task.project_id,
            gate_id=task.gate_id,
            voter_role=user.get("role", "reviewer"),
            vote=request.vote,
            comment=request.comment,
        )
        # 投票后返回更新后的审核详情（完整 camelCase Review 对象）
        updated_review = await service.get_review(review_id)
        return {"data": updated_review, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# POST /api/reviews/batch - 批量审核
# ------------------------------------------------------------------

@router.post("/batch")
async def batch_vote(
    request: BatchReviewRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """批量审核多个审核任务。"""
    service = ReviewService(db)
    try:
        result = await service.batch_vote(request.review_ids, request.vote)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }


# ------------------------------------------------------------------
# POST /api/reviews/{review_id}/escalate - 审核升级
# ------------------------------------------------------------------

@router.post("/{review_id}/escalate")
async def escalate(
    review_id: str,
    request: EscalateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """升级审核任务，创建遗留问题。"""
    service = ReviewService(db)
    try:
        result = await service.escalate(review_id, request.reason)
        return {"data": result, "error": None, "meta": {"request_id": ""}}
    except AppException as e:
        return {
            "data": None,
            "error": {"code": e.code.value, "message": e.message},
            "meta": {"request_id": ""},
        }