"""敏感数据过滤工具。

在将文本发送到 LLM 之前，必须调用此模块中的函数来过滤敏感信息。
"""

import re


def filter_sensitive_data(text: str) -> str:
    """过滤文本中的敏感信息，用于发送到 LLM 之前。

    Args:
        text: 需要过滤的原始文本。

    Returns:
        过滤后的文本，敏感信息已替换为占位符。

    Examples:
        >>> filter_sensitive_data("我的身份证 110101199001011234 和手机 13800138000")
        '我的身份证 [身份证号已隐藏] 和手机 [手机号已隐藏]'
    """
    if not text:
        return text

    # 身份证号（18位，末位可以是数字或 X/x）
    text = re.sub(r"\b\d{17}[\dXx]\b", "[身份证号已隐藏]", text)

    # 手机号（中国大陆格式）
    text = re.sub(r"\b1[3-9]\d{9}\b", "[手机号已隐藏]", text)

    # 邮箱地址
    text = re.sub(r"\b[\w.-]+@[\w.-]+\.\w+\b", "[邮箱已隐藏]", text)

    return text