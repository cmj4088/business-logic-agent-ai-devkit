"""语言检测 — M4 Agent 编排。

检测 LLM 输出是否为中文，非中文触发重试。
"""
import re


def is_chinese(text: str) -> bool:
    """检测文本是否主要为中文。

    Args:
        text: 待检测文本。

    Returns:
        True 表示主要为中文。
    """
    if not text:
        return True

    # 统计中文字符
    chinese_chars = len(re.findall(r'[一-鿿]', text))
    total_chars = len(re.sub(r'\s', '', text))

    if total_chars == 0:
        return True

    # 中文字符占比超过 30% 即认为主要是中文
    return (chinese_chars / total_chars) >= 0.3


def check_language(text: str) -> tuple[bool, str]:
    """检查语言并返回是否需要重试。

    Returns:
        (is_chinese_result, needs_retry_reason)
    """
    if is_chinese(text):
        return True, ""
    return False, "输出非中文，需要重试"