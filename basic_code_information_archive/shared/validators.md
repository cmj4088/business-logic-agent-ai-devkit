# validators.py — 共享校验函数模块

## 概述
该文件提供了项目名称、邮箱、密码、URL 等常用字段的**校验函数**，以及**路径遍历攻击检测**函数。所有校验函数返回错误信息字符串或 `None`（校验通过），遵循统一的"校验通过返回 None"模式，方便调用方进行判断。

## 函数详细说明

### validate_project_name(name)
- **功能**: 校验项目名称
- **参数**: `name: str` — 项目名称字符串
- **返回值**: `Optional[str]` — 校验失败返回错误信息字符串，通过返回 `None`
- **校验规则**:
  1. 不能为空或纯空白字符
  2. 长度不能超过 50 个字符
  3. 长度至少需要 2 个字符
- **使用示例**:
  ```python
  >>> validate_project_name("") is not None
  True
  >>> validate_project_name("测试项目") is None
  True
  >>> validate_project_name("A") is not None
  True
  ```

### validate_email(email)
- **功能**: 校验邮箱格式
- **参数**: `email: str` — 邮箱地址字符串
- **返回值**: `Optional[str]` — 格式不正确返回错误信息，正确返回 `None`
- **校验规则**: 使用正则表达式 `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` 匹配
- **使用示例**:
  ```python
  >>> validate_email("test@example.com") is None
  True
  >>> validate_email("invalid-email") is not None
  True
  ```

### validate_password(password)
- **功能**: 校验密码强度
- **参数**: `password: str` — 密码字符串
- **返回值**: `Optional[str]` — 强度不足返回错误信息，通过返回 `None`
- **校验规则**:
  1. 至少 8 个字符
  2. 必须包含至少一个数字
  3. 必须包含至少一个字母（大小写均可）
- **使用示例**:
  ```python
  >>> validate_password("1234567") is not None   # 少于 8 位
  True
  >>> validate_password("abcdefgh") is not None   # 没有数字
  True
  >>> validate_password("abc12345") is None       # 合法密码
  True
  ```

### validate_url(url)
- **功能**: 校验 URL 格式
- **参数**: `url: str` — URL 字符串
- **返回值**: `Optional[str]` — 格式不正确返回错误信息，正确返回 `None`
- **校验规则**: 使用正则表达式 `^https?://[^\s/$.?#].[^\s]*$` 匹配，要求以 `http://` 或 `https://` 开头
- **使用示例**:
  ```python
  >>> validate_url("https://example.com") is None
  True
  >>> validate_url("not-a-url") is not None
  True
  ```

### has_path_traversal(path)
- **功能**: 检测路径遍历攻击
- **参数**: `path: str` — 待检查的路径字符串
- **返回值**: `bool` — 包含 `".."` 则返回 `True`（存在攻击风险），否则返回 `False`
- **检测规则**: 检查路径中是否包含 `".."` 模式，防止目录遍历漏洞
- **使用示例**:
  ```python
  >>> has_path_traversal("../../../etc/passwd")
  True
  >>> has_path_traversal("data/config.json")
  False
  ```

## 校验函数设计模式

所有 validate 函数遵循统一的返回模式：
- **校验通过**: 返回 `None`
- **校验失败**: 返回描述性错误信息字符串

调用方可以这样使用：
```python
error = validate_project_name(name)
if error:
    raise AppException(ErrorCode.VALIDATION_ERROR, error)
```

## 依赖关系
- `re` — Python 正则表达式模块
- `typing.Optional` — 类型注解

## 注意事项
- 密码强度校验仅检查基本要求（8 位、数字、字母），不检查特殊字符
- 邮箱校验使用较宽松的正则，允许子域名和特殊字符
- URL 校验要求以 `http://` 或 `https://` 开头
- 路径遍历检测仅检查 `".."` 模式，是一种简单但有效的检测方式
- 所有校验函数不抛出异常，而是返回错误信息，由调用方决定如何处理
- 校验函数是纯函数，无副作用，可以安全地在任何地方调用