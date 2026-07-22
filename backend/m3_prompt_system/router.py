"""提示词系统路由 — M3。"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from m0_infrastructure.database import get_db
from m1_auth_security.middleware import get_current_user
from .models import RenderRequest, TemplateUpdateRequest
from .renderer import PromptRenderer, ROLE_NAMES, DEFAULT_TEMPLATES
from .context_builder import build_context

router = APIRouter(prefix="/api/prompts", tags=["提示词"])


@router.get("/templates")
async def list_templates(user: dict = Depends(get_current_user)):
    """获取所有提示词模板列表。"""
    templates = []
    for role, name in ROLE_NAMES.items():
        templates.append({
            "role": role,
            "name": name,
            "has_custom": False,  # MVP 阶段默认使用内置模板
        })
    return {"data": templates, "error": None, "meta": {"request_id": ""}}


@router.get("/templates/{role}")
async def get_template(role: str, user: dict = Depends(get_current_user)):
    """获取角色提示词模板详情。"""
    renderer = PromptRenderer()
    content = renderer.get_template_content(role)
    return {
        "data": {
            "role": role,
            "name": ROLE_NAMES.get(role, role),
            "content": content,
            "version": "1.0",
            "updated_at": "",
        },
        "error": None,
        "meta": {"request_id": ""},
    }


@router.put("/templates/{role}")
async def update_template(
    role: str,
    request: TemplateUpdateRequest,
    user: dict = Depends(get_current_user),
):
    """更新角色提示词模板（MVP 阶段仅验证，不持久化）。"""
    renderer = PromptRenderer()
    valid, error = renderer.validate_template(request.content)
    if not valid:
        return {
            "data": None,
            "error": {"code": "VALIDATION_ERROR", "message": f"模板语法错误: {error}"},
            "meta": {"request_id": ""},
        }
    return {
        "data": {"role": role, "message": "模板验证通过（MVP 阶段不持久化自定义模板）"},
        "error": None,
        "meta": {"request_id": ""},
    }


@router.post("/render")
async def render_prompt(
    request: RenderRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """渲染 system prompt（内部调用）。"""
    renderer = PromptRenderer()
    try:
        prompt = renderer.render(request.role, request.project_context)
        return {
            "data": {"prompt": prompt, "role": request.role},
            "error": None,
            "meta": {"request_id": ""},
        }
    except Exception as e:
        return {
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": str(e)},
            "meta": {"request_id": ""},
        }


@router.post("/preview")
async def preview_prompt(
    request: RenderRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """预览渲染后的提示词（带完整上下文构建）。"""
    context = request.project_context
    if not context.get("artifacts") and context.get("project", {}).get("id"):
        # 如果有项目 ID，从数据库构建上下文
        try:
            context = await build_context(
                db,
                context["project"]["id"],
                context.get("stage", {}).get("name"),
                context.get("user_input"),
            )
        except Exception:
            pass  # 使用传入的上下文

    renderer = PromptRenderer()
    try:
        prompt = renderer.render(request.role, context)
        return {
            "data": {"prompt": prompt, "role": request.role, "context_used": context},
            "error": None,
            "meta": {"request_id": ""},
        }
    except Exception as e:
        return {
            "data": None,
            "error": {"code": "INTERNAL_ERROR", "message": str(e)},
            "meta": {"request_id": ""},
        }