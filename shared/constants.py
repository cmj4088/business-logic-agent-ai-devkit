"""Business Logic Agent 全局常量。

定义 IPD 阶段列表、Agent 角色列表、门禁列表、复杂度活动数等常量。
"""

# IPD 6 阶段（lite 模式）
IPD_STAGES: list[str] = ["concept", "plan", "develop", "verify", "launch", "lifecycle"]

# 6 个 Agent 角色
AGENT_ROLES: list[str] = ["product_manager", "rd", "qa", "marketing", "manufacturing", "finance"]

# 门禁列表
GATES: list[str] = ["CDCP", "PDCP", "TR3", "TR4", "TR5", "TR6", "ADCP", "LDCP"]

# 复杂度对应活动数
COMPLEXITY_ACTIVITY_COUNTS: dict[str, int] = {"lite": 24, "standard": 31, "full": 34}

# 错误码前缀
ERROR_PREFIXES: list[str] = [
    "VALIDATION_",
    "NOT_FOUND",
    "FORBIDDEN_",
    "CONFLICT_",
    "LLM_",
    "AUTH_",
    "INTERNAL_",
]