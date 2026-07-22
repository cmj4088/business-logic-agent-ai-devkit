"""熔断器实现 — M4 Agent 编排。"""
import time
from enum import Enum
from shared.errors import ErrorCode, AppException


class CircuitState(Enum):
    CLOSED = "closed"        # 正常
    OPEN = "open"           # 熔断
    HALF_OPEN = "half_open"  # 半开


class CircuitBreaker:
    """熔断器：连续失败 N 次后熔断，T 分钟后自动重试。"""

    def __init__(self, max_failures: int = 5, retry_after_seconds: int = 600):
        self.max_failures = max_failures
        self.retry_after_seconds = retry_after_seconds
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time: float = 0
        self.opened_at: float = 0

    def record_success(self) -> None:
        """记录成功调用。"""
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED

    def record_failure(self) -> None:
        """记录失败调用。"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.max_failures:
            self.state = CircuitState.OPEN
            self.opened_at = time.time()

    def can_call(self) -> bool:
        """检查是否可以调用。"""
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            elapsed = time.time() - self.opened_at
            if elapsed >= self.retry_after_seconds:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        # HALF_OPEN
        return True

    def check_and_raise(self, provider: str) -> None:
        """检查熔断状态，熔断时抛出异常。"""
        if not self.can_call():
            raise AppException(
                ErrorCode.LLM_ERROR,
                f"模型 {provider} 已熔断，请等待 {self.retry_after_seconds // 60} 分钟后重试",
                status_code=502,
            )