"""Skill 注册表 — 统一管理所有 Skill 的注册和调用。"""

import logging
from typing import Any
from .base import BaseSkill, SkillContext, SkillResult

logger = logging.getLogger(__name__)


class SkillRegistry:
    """Skill 注册表。

    单例模式，全局唯一。所有 Skill 实现通过此类注册和调用。
    """

    _instance: "SkillRegistry | None" = None
    _skills: dict[str, BaseSkill] = {}

    def __new__(cls) -> "SkillRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._skills = {}
        return cls._instance

    def register(self, skill: BaseSkill) -> None:
        """注册一个 Skill。

        Args:
            skill: Skill 实例。

        Raises:
            ValueError: Skill 名称已存在。
        """
        if skill.name in self._skills:
            raise ValueError(f"Skill '{skill.name}' 已注册")
        self._skills[skill.name] = skill
        logger.info("Skill 已注册: %s - %s", skill.name, skill.description)

    def unregister(self, skill_name: str) -> None:
        """注销一个 Skill。"""
        if skill_name in self._skills:
            del self._skills[skill_name]
            logger.info("Skill 已注销: %s", skill_name)

    def get(self, skill_name: str) -> BaseSkill | None:
        """获取指定名称的 Skill。

        Args:
            skill_name: Skill 名称。

        Returns:
            BaseSkill 实例，未找到返回 None。
        """
        return self._skills.get(skill_name)

    def list_skills(self) -> dict[str, dict]:
        """列出所有已注册的 Skill。

        Returns:
            {skill_name: {"name": str, "description": str}} 的字典。
        """
        return {
            name: {
                "name": skill.name,
                "description": skill.description,
                "tool_names": self._get_tool_names(skill),
            }
            for name, skill in self._skills.items()
        }

    async def execute(
        self,
        skill_name: str,
        context: SkillContext,
    ) -> SkillResult:
        """执行指定 Skill。

        Args:
            skill_name: Skill 名称。
            context: 执行上下文。

        Returns:
            SkillResult: 执行结果。

        Raises:
            ValueError: Skill 未找到。
        """
        skill = self._skills.get(skill_name)
        if skill is None:
            raise ValueError(f"Skill '{skill_name}' 未注册，可用: {list(self._skills.keys())}")

        # 参数校验
        is_valid, error_msg = await skill.validate(context)
        if not is_valid:
            return SkillResult(
                success=False,
                skill_name=skill_name,
                error_message=error_msg,
            )

        # 执行
        try:
            result = await skill.execute(context)
            return result
        except Exception as e:
            logger.exception("Skill '%s' 执行异常: %s", skill_name, e)
            return SkillResult(
                success=False,
                skill_name=skill_name,
                error_message=f"Skill 执行异常: {str(e)}",
            )

    def _get_tool_names(self, skill: BaseSkill) -> list[str]:
        """获取 Skill 注册的 tool 名称列表。

        每个 Skill 可注册多个 tool，由子类覆盖。
        """
        if hasattr(skill, "get_tools"):
            return [t["tool_name"] for t in skill.get_tools()]
        return [skill.name]

    @classmethod
    def get_instance(cls) -> "SkillRegistry":
        """获取全局单例。"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """重置注册表（仅用于测试）。"""
        cls._instance = None
        cls._skills = {}