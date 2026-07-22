"""共享校验函数。

提供项目名称、邮箱、密码、URL 等常用字段的校验函数，
以及路径遍历攻击检测函数。
"""

import re
from typing import Optional


def validate_project_name(name: str) -> Optional[str]:
    """校验项目名称，返回错误信息或 None。

    Args:
        name: 项目名称字符串。

    Returns:
        如果校验失败则返回错误信息字符串，否则返回 None。

    Examples:
        >>> validate_project_name("") is not None
        True
        >>> validate_project_name("测试项目") is None
        True
    """
    if not name or not name.strip():
        return "项目名称不能为空"
    if len(name) > 50:
        return "项目名称不能超过50个字符"
    if len(name) < 2:
        return "项目名称至少需要2个字符"
    return None


def validate_email(email: str) -> Optional[str]:
    """校验邮箱格式。

    Args:
        email: 邮箱地址字符串。

    Returns:
        如果格式不正确则返回错误信息字符串，否则返回 None。

    Examples:
        >>> validate_email("test@example.com") is None
        True
        >>> validate_email("invalid-email") is not None
        True
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        return "邮箱格式不正确"
    return None


def validate_password(password: str) -> Optional[str]:
    """校验密码强度：至少 8 位，包含数字和字母。

    Args:
        password: 密码字符串。

    Returns:
        如果强度不足则返回错误信息字符串，否则返回 None。

    Examples:
        >>> validate_password("1234567") is not None
        True
        >>> validate_password("abcdefgh") is not None
        True
        >>> validate_password("abc12345") is None
        True
    """
    if len(password) < 8:
        return "密码至少需要8个字符"
    if not re.search(r"[0-9]", password):
        return "密码必须包含数字"
    if not re.search(r"[a-zA-Z]", password):
        return "密码必须包含字母"
    return None


def validate_url(url: str) -> Optional[str]:
    """校验 URL 格式。

    Args:
        url: URL 字符串。

    Returns:
        如果格式不正确则返回错误信息字符串，否则返回 None。

    Examples:
        >>> validate_url("https://example.com") is None
        True
        >>> validate_url("not-a-url") is not None
        True
    """
    pattern = r"^https?://[^\s/$.?#].[^\s]*$"
    if not re.match(pattern, url):
        return "URL格式不正确"
    return None


def has_path_traversal(path: str) -> bool:
    """检测路径遍历攻击。

    检查路径中是否包含 ".." 模式，防止目录遍历漏洞。

    Args:
        path: 待检查的路径字符串。

    Returns:
        如果包含 ".." 则返回 True，否则返回 False。

    Examples:
        >>> has_path_traversal("../../../etc/passwd")
        True
        >>> has_path_traversal("data/config.json")
        False
    """
    return ".." in path