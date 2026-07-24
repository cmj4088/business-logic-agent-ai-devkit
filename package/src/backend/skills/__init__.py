"""IPD Agent Skills 包。

提供 3 个内置 Skill 的 Python 实现：
- ipd-data-analysis: 数据分析（市场/财务/质量）
- ipd-xlsx: Excel 文件生成（BOM/预算/进度）
- ipd-docx: Word 文档生成（MRD/PRD/技术方案）

通过 SkillRegistry 统一注册和调用。
"""
from .registry import SkillRegistry
from .base import BaseSkill, SkillResult, SkillContext

__all__ = ["SkillRegistry", "BaseSkill", "SkillResult", "SkillContext"]