"""全局中间件 — M0 基础设施。

提供 RequestID 注入和请求日志记录中间件。
"""
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from structlog import get_logger

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """为每个请求注入唯一 request_id。"""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """记录请求日志（方法、路径、状态码、耗时）。"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000  # 毫秒

        # 不记录健康检查日志
        if request.url.path != "/api/health":
            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration, 2),
                request_id=getattr(request.state, "request_id", "unknown"),
            )

        return response