"""Business Logic Agent 共享类型定义。

包含 IPD 阶段、Agent 角色、编排模式、复杂度级别等枚举类型。
"""

from enum import Enum


class IPDStage(str, Enum):
    """IPD 产品开发阶段（6 个阶段）。"""

    CONCEPT = "concept"
    PLAN = "plan"
    DEVELOP = "develop"
    VERIFY = "verify"
    LAUNCH = "launch"
    LIFECYCLE = "lifecycle"


class AgentRole(str, Enum):
    """Agent 角色定义（6 个角色）。"""

    PRODUCT_MANAGER = "product_manager"
    RD = "rd"
    QA = "qa"
    MARKETING = "marketing"
    MANUFACTURING = "manufacturing"
    FINANCE = "finance"


class OrchestrationMode(str, Enum):
    """Agent 编排模式。"""

    PARALLEL = "parallel"
    SEQUENTIAL = "sequential"
    DEBATE = "debate"


class ComplexityTier(str, Enum):
    """项目复杂度级别。"""

    AUTO = "auto"
    LITE = "lite"
    STANDARD = "standard"
    FULL = "full"