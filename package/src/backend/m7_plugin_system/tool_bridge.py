"""Tool Bridge — Skill 到 Agent Tool 的桥接转换。

将 SkillRegistry 中的 Skill 转换为 Agent 可调用的 tool 格式。
允许 Agent 在编排过程中动态调用 Skill 生成产出物。
"""
import json
import logging
from typing import Any

from skills.base import SkillContext, SkillResult
from skills.registry import SkillRegistry

logger = logging.getLogger(__name__)


class SkillToolBridge:
    """Skill → Agent Tool 桥接器。

    将 SkillRegistry 中的每个 Skill 的 get_tools() 输出
    转换为 M7 插件系统兼容的 tool 格式，使 Agent 可调用。
    """

    def __init__(self, registry: SkillRegistry | None = None):
        self.registry = registry or SkillRegistry.get_instance()

    def get_all_tools(self) -> list[dict]:
        """获取所有已注册 Skill 的 tool 列表（M7 插件格式）。"""
        tools = []
        for skill_name, skill_info in self.registry.list_skills().items():
            skill = self.registry.get(skill_name)
            if skill and hasattr(skill, "get_tools"):
                for t in skill.get_tools():
                    tools.append({
                        "skill_name": skill_name,
                        "tool_name": t["tool_name"],
                        "tool_schema": t["tool_schema"],
                        "description": skill_info.get("description", ""),
                        "source": "skill",
                    })
        return tools

    def get_tools_by_skill(self, skill_name: str) -> list[dict]:
        """获取指定 Skill 的 tool 列表。"""
        skill = self.registry.get(skill_name)
        if skill is None:
            return []
        if hasattr(skill, "get_tools"):
            return [
                {
                    "skill_name": skill_name,
                    "tool_name": t["tool_name"],
                    "tool_schema": t["tool_schema"],
                    "source": "skill",
                }
                for t in skill.get_tools()
            ]
        return []

    def get_skill_for_tool(self, tool_name: str) -> str | None:
        """根据 tool 名称查找对应的 Skill 名称。"""
        for skill_name, skill_info in self.registry.list_skills().items():
            if tool_name in skill_info.get("tool_names", []):
                return skill_name
            # 也检查 get_tools 方法
            skill = self.registry.get(skill_name)
            if skill and hasattr(skill, "get_tools"):
                for t in skill.get_tools():
                    if t["tool_name"] == tool_name:
                        return skill_name
        return None

    async def execute_tool(
        self,
        tool_name: str,
        project_id: str,
        stage: str,
        activity_key: str,
        agent_role: str,
        params: dict,
        user_input: str = "",
    ) -> SkillResult:
        """通过 tool 名称执行对应的 Skill。

        Args:
            tool_name: Agent 调用的 tool 名称（如 "analyze_data"）。
            project_id: 项目 ID。
            stage: 当前阶段。
            activity_key: 活动标识。
            agent_role: 发起调用的 Agent 角色。
            params: tool 参数（与 tool_schema 中定义的参数一致）。
            user_input: 用户附加上下文。

        Returns:
            SkillResult: Skill 执行结果。
        """
        # 查找 tool 对应的 Skill
        skill_name = self.get_skill_for_tool(tool_name)
        if skill_name is None:
            raise ValueError(f"Tool '{tool_name}' 未对应任何已注册的 Skill")

        # 构建执行上下文
        context = SkillContext(
            project_id=project_id,
            stage=stage,
            activity_key=activity_key,
            agent_role=agent_role,
            params=params,
            user_input=user_input,
        )

        # 执行 Skill
        return await self.registry.execute(skill_name, context)

    def to_plugin_format(self) -> list[dict]:
        """将 Skill 转换为 M7 插件格式。

        返回格式与 m7_plugin_system 中 BUILTIN_PLUGINS 的 tools 字段一致。
        """
        result = []
        for skill_name, skill_info in self.registry.list_skills().items():
            for tool in self.get_tools_by_skill(skill_name):
                result.append({
                    "skill_name": skill_name,
                    "tool_name": tool["tool_name"],
                    "tool_schema": tool["tool_schema"],
                    "description": skill_info.get("description", ""),
                })
        return result