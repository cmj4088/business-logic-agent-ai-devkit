"""统一错误码和异常类。

定义应用程序中使用的所有错误码和统一的 AppException 异常类。
"""

from enum import Enum


class ErrorCode(str, Enum):
    """应用程序统一错误码枚举。"""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    FORBIDDEN = "FORBIDDEN_ACCESS"
    CONFLICT = "CONFLICT_RESOURCE"
    LLM_ERROR = "LLM_SERVICE_ERROR"
    AUTH_ERROR = "AUTH_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class AppException(Exception):
    """应用程序统一异常类。

    Attributes:
        code: 错误码，对应 ErrorCode 枚举值。
        message: 人类可读的错误描述。
        status_code: HTTP 状态码，默认 500。
    """

    def __init__(self, code: ErrorCode, message: str, status_code: int = 500) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)