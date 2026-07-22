"""Skill Plugin — 将 Skill 包装为 M7 插件。

Skill 插件是内置插件的特殊类型，通过 SkillRegistry 注册到 M7 插件系统。
与普通插件（如 web_search）不同，Skill 插件由 skills/ 包管理，
通过 SkillToolBridge 转换为 Agent 可调用的 tool。

MVP 阶段内置 3 个 Skill 插件：
- ipd-data-analysis: 数据分析（市场/财务/质量/成本）
- ipd-xlsx: Excel 文件生成（BOM/预算/进度/竞品矩阵）
- ipd-docx: Word 文档生成（MRD/PRD/技术方案/测试报告）
"""
import json
import logging
from typing import Any

from .tool_bridge import SkillToolBridge

logger = logging.getLogger(__name__)

# Skill 插件定义（用于 M7 插件系统的 BUILTIN_PLUGINS）
SKILL_PLUGINS: dict[str, dict] = {}


def build_skill_plugins() -> dict[str, dict]:
    """从 SkillRegistry 构建 Skill 插件定义。

    遍历所有已注册的 Skill，将其转换为 M7 插件格式。
    返回格式与 plugin_service.py 中的 BUILTIN_PLUGINS 一致。

    Returns:
        {skill_plugin_id: plugin_definition} 的字典。
    """
    global SKILL_PLUGINS

    bridge = SkillToolBridge()
    registry = bridge.registry

    plugins = {}
    for skill_name, skill_info in registry.list_skills().items():
        skill = registry.get(skill_name)
        if skill is None:
            continue

        # 获取 Skill 的 tool 列表
        tools = bridge.get_tools_by_skill(skill_name)

        # 构建参数 schema（从 tool schema 中提取）
        parameters = {}
        for tool in tools:
            try:
                schema = json.loads(tool["tool_schema"])
                func_params = schema.get("function", {}).get("parameters", {})
                properties = func_params.get("properties", {})
                for param_name, param_info in properties.items():
                    parameters[param_name] = param_info
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        plugin_id = skill_name  # 使用 skill 名称作为 plugin_id

        plugins[plugin_id] = {
            "plugin_id": plugin_id,
            "name": skill_info.get("name", skill_name),
            "version": "1.0.0",
            "description": skill_info.get("description", ""),
            "category": "IPD 技能",
            "config_schema": {
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "是否启用此 Skill 插件",
                        "default": True,
                    },
                    "auto_invoke": {
                        "type": "boolean",
                        "description": "是否在相关活动触发时自动调用",
                        "default": True,
                    },
                },
            },
            "tools": tools,
            "skill_name": skill_name,
            "source": "skill",
        }

    SKILL_PLUGINS = plugins
    return plugins


def get_skill_plugin_ids() -> list[str]:
    """获取所有 Skill 插件的 ID 列表。"""
    global SKILL_PLUGINS
    if not SKILL_PLUGINS:
        build_skill_plugins()
    return list(SKILL_PLUGINS.keys())


def get_skill_plugin(plugin_id: str) -> dict | None:
    """获取指定 Skill 插件定义。"""
    global SKILL_PLUGINS
    if not SKILL_PLUGINS:
        build_skill_plugins()
    return SKILL_PLUGINS.get(plugin_id)


def is_skill_plugin(plugin_id: str) -> bool:
    """判断是否为 Skill 插件。"""
    return plugin_id in get_skill_plugin_ids()


def refresh_skill_plugins() -> dict[str, dict]:
    """刷新 Skill 插件定义（在 Skill 注册/注销后调用）。"""
    global SKILL_PLUGINS
    SKILL_PLUGINS = {}
    return build_skill_plugins()