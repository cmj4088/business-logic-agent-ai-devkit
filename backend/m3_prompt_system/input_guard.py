"""输入防护 — M3 提示词系统。

提供用户输入的安全包装和数据过滤。
"""
from shared.data_filter import filter_sensitive_data


def wrap_user_input(text: str) -> str:
    """将用户输入包裹在 XML 标签内，防止 prompt injection。

    系统指令和用户输入严格分离，LLM 仅遵循 <system_instruction> 中的指令，
    <user_input> 中的内容只作为分析对象，不作为指令执行。

    Args:
        text: 用户原始输入。

    Returns:
        XML 标签包裹后的文本。
    """
    if not text:
        return "<user_input>\n\n</user_input>"
    # 先过滤敏感数据
    safe_text = filter_sensitive_data(text)
    return f"<user_input>\n{safe_text}\n</user_input>"


def wrap_system_instruction(text: str) -> str:
    """将系统指令包裹在 XML 标签内。"""
    return f"<system_instruction>\n{text}\n</system_instruction>"


def sanitize_user_input(text: str) -> str:
    """对用户输入进行安全处理。

    1. 过滤敏感数据
    2. XML 标签包裹
    3. 移除潜在的 prompt injection 模式

    Args:
        text: 用户原始输入。

    Returns:
        安全处理后的文本。
    """
    if not text:
        return ""

    # 过滤敏感数据
    safe_text = filter_sensitive_data(text)

    # 移除常见的 prompt injection 尝试
    # 移除 "ignore previous instructions" 等模式
    injection_patterns = [
        "ignore previous instructions",
        "ignore all previous",
        "disregard previous",
        "forget your instructions",
        "you are now",
        "new instructions:",
        "system prompt:",
        "<system_instruction>",
        "</system_instruction>",
        "<user_input>",
        "</user_input>",
    ]
    for pattern in injection_patterns:
        safe_text = safe_text.replace(pattern, f"[已过滤: {pattern[:20]}...]")

    return safe_text