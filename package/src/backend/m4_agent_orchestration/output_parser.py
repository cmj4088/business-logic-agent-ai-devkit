"""输出解析器 — M4 Agent 编排。

解析 LLM 的 JSON 输出，失败时重试 2 次后降级为纯文本。
"""
import json
import re
from typing import Any


def parse_json_output(text: str, max_retries: int = 2) -> dict[str, Any]:
    """尝试解析 LLM 输出为 JSON。

    1. 尝试直接解析
    2. 尝试提取 ```json 代码块
    3. 尝试提取 { ... } 块
    4. 降级为纯文本

    Args:
        text: LLM 原始输出。
        max_retries: 最大重试次数（保留参数，实际由调用方控制）。

    Returns:
        解析结果，包含 parsed 字段和 content 字段。
    """
    # 尝试 1: 直接解析
    try:
        parsed = json.loads(text)
        return {"parsed": True, "content": parsed, "raw": text}
    except json.JSONDecodeError:
        pass

    # 尝试 2: 提取 ```json 代码块
    json_block_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if json_block_match:
        try:
            parsed = json.loads(json_block_match.group(1))
            return {"parsed": True, "content": parsed, "raw": text}
        except json.JSONDecodeError:
            pass

    # 尝试 3: 提取 { ... } 块
    brace_match = re.search(r'\{.*\}', text, re.DOTALL)
    if brace_match:
        try:
            parsed = json.loads(brace_match.group(0))
            return {"parsed": True, "content": parsed, "raw": text}
        except json.JSONDecodeError:
            pass

    # 降级: 纯文本
    return {"parsed": False, "content": text, "raw": text}


def extract_json_with_retry(text: str, max_retries: int = 2) -> dict[str, Any]:
    """带重试提示的 JSON 提取（用于 LLM 重试场景）。

    Args:
        text: LLM 原始输出。
        max_retries: 最大重试次数。

    Returns:
        解析结果，包含 needs_retry 字段指示是否需要重试。
    """
    result = parse_json_output(text)
    if not result["parsed"]:
        result["needs_retry"] = True
    else:
        result["needs_retry"] = False
    return result