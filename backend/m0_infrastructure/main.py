"""FastAPI 应用入口 — M0 基础设施。

负责应用初始化、路由注册、中间件注册、生命周期事件处理。
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import init_db, close_db
from .logging_config import setup_logging
from .middleware import RequestIDMiddleware, RequestLoggingMiddleware
from shared.errors import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理。"""
    # startup
    setup_logging()
    settings = get_settings()
    app.state.settings = settings
    await init_db(settings)

    # 注册内置 Skill 到 SkillRegistry
    _register_builtin_skills()

    yield
    # shutdown
    await close_db()


def _register_builtin_skills() -> None:
    """注册内置的 3 个 IPD Skill 到 SkillRegistry。

    这些 Skill 通过 M7 插件系统暴露为 Agent 可调用的工具。
    """
    from skills.registry import SkillRegistry
    from skills.data_analysis import DataAnalysisSkill
    from skills.xlsx_skill import XlsxSkill
    from skills.docx_skill import DocxSkill

    registry = SkillRegistry.get_instance()

    skills = [
        DataAnalysisSkill(),
        XlsxSkill(),
        DocxSkill(),
    ]

    for skill in skills:
        try:
            registry.register(skill)
        except ValueError:
            # 已注册的 Skill 跳过（如热重载场景）
            pass


def create_app() -> FastAPI:
    """创建并配置 FastAPI 应用实例。"""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # CORS — 从配置读取允许源，支持逗号分隔多个源
    cors_origins = settings.cors_origins.split(",") if settings.cors_origins else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 自定义中间件
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # 全局异常处理器
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "data": None,
                "error": {"code": exc.code.value, "message": exc.message},
                "meta": {"request_id": getattr(request.state, "request_id", "")},
            },
        )

    # 健康检查
    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "version": settings.app_version}

    # === M1 认证与安全路由 ===
    from m1_auth_security.router import router as auth_router
    app.include_router(auth_router)

    # === M2 工作流引擎路由 ===
    from m2_workflow_engine.router import router as workflow_router
    app.include_router(workflow_router)

    # === M3 提示词系统路由 ===
    from m3_prompt_system.router import router as prompt_router
    app.include_router(prompt_router)

    # === M4 Agent 编排路由 ===
    from m4_agent_orchestration.router import router as agent_router
    app.include_router(agent_router)

    # === M5 产出物管理路由 ===
    from m5_artifact_management.router import router as artifact_router
    app.include_router(artifact_router)

    # === M6 审核系统路由 ===
    from m6_review_system.router import router as review_router
    app.include_router(review_router)

    # === M7 插件系统路由 ===
    from m7_plugin_system.router import router as plugin_router
    app.include_router(plugin_router)

    # === M8 实时通信路由 ===
    from m8_realtime_communication.router import router as rt_router
    app.include_router(rt_router)

    # === M9 用量追踪路由 ===
    from m9_usage_tracking.router import router as usage_router
    app.include_router(usage_router)

    # === M10 异常恢复路由 ===
    from m10_recovery.router import router as recovery_router
    app.include_router(recovery_router)

    # === 设置与数据管理路由 ===
    from .settings_router import router as settings_router
    app.include_router(settings_router)

    return app


app = create_app()