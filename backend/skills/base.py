"""Skill 基础类 — 所有 Skill 的抽象基类。"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SkillContext:
    """Skill 执行上下文。"""

    project_id: str
    stage: str
    activity_key: str
    agent_role: str
    params: dict = field(default_factory=dict)
    user_input: str = ""


@dataclass
class SkillResult:
    """Skill 执行结果。"""

    success: bool
    skill_name: str
    output: str = ""
    file_path: str | None = None
    file_type: str | None = None  # "docx" | "xlsx" | "md"
    artifact_type: str | None = None
    tokens_used: int = 0
    error_message: str = ""
    metadata: dict = field(default_factory=dict)


class BaseSkill(ABC):
    """所有 Skill 的抽象基类。

    子类必须实现 execute() 方法。
    可选的钩子：validate(), cleanup()。
    """

    def __init__(self, db: Any = None):
        self.db = db
        self._name: str = ""
        self._description: str = ""

    @property
    @abstractmethod
    def name(self) -> str:
        """Skill 名称（唯一标识）。"""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Skill 描述。"""
        ...

    @abstractmethod
    async def execute(self, context: SkillContext) -> SkillResult:
        """执行 Skill 逻辑。

        Args:
            context: 执行上下文，包含项目ID、阶段、活动、参数等。

        Returns:
            SkillResult: 执行结果。
        """
        ...

    async def validate(self, context: SkillContext) -> tuple[bool, str]:
        """验证参数是否合法。

        Args:
            context: 执行上下文。

        Returns:
            (is_valid, error_message) 元组。
        """
        return True, ""

    async def cleanup(self) -> None:
        """清理资源（可选覆盖）。"""
        pass