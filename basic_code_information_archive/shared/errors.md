# errors.py — 统一错误码和异常类

## 概述
该文件定义了应用程序中使用的**统一错误码枚举**和**统一异常类**。通过 `ErrorCode` 枚举和 `AppException` 异常类，确保整个应用使用一致的错误处理方式，方便前端根据错误码进行差异化处理。

## 类详细说明

### ErrorCode（继承 str, Enum）
应用程序统一错误码枚举，所有错误码均为字符串类型。

| 枚举值 | 字符串值 | HTTP 状态码 | 说明 |
|--------|----------|-------------|------|
| `VALIDATION_ERROR` | `"VALIDATION_ERROR"` | 通常 422 | 输入校验失败 |
| `NOT_FOUND` | `"NOT_FOUND"` | 通常 404 | 资源未找到 |
| `FORBIDDEN` | `"FORBIDDEN_ACCESS"` | 通常 403 | 权限不足 |
| `CONFLICT` | `"CONFLICT_RESOURCE"` | 通常 409 | 资源冲突 |
| `LLM_ERROR` | `"LLM_SERVICE_ERROR"` | 通常 502 | LLM 服务错误 |
| `AUTH_ERROR` | `"AUTH_FAILED"` | 通常 401 | 认证失败 |
| `INTERNAL_ERROR` | `"INTERNAL_ERROR"` | 通常 500 | 内部服务器错误 |

- **继承 `str` 和 `Enum`**: 使枚举值可以像字符串一样使用，同时保持枚举的类型安全
- **与 `constants.py` 中的 `ERROR_PREFIXES` 对应**: 错误码前缀用于错误分类

### AppException（继承 Exception）
应用程序统一异常类，用于在业务逻辑中抛出结构化异常。

#### 构造函数
```python
def __init__(self, code: ErrorCode, message: str, status_code: int = 500)
```

#### 属性
| 属性 | 类型 | 说明 |
|------|------|------|
| `code` | `ErrorCode` | 错误码，对应 ErrorCode 枚举值 |
| `message` | `str` | 人类可读的错误描述信息 |
| `status_code` | `int` | HTTP 状态码，默认 500 |

#### 使用示例
```python
# 抛出资源未找到异常
raise AppException(ErrorCode.NOT_FOUND, "项目不存在", status_code=404)

# 抛出校验错误异常
raise AppException(ErrorCode.VALIDATION_ERROR, "项目名称不能为空", status_code=422)

# 抛出认证失败异常
raise AppException(ErrorCode.AUTH_ERROR, "Token 已过期", status_code=401)
```

## 依赖关系
- `enum.Enum` — Python 枚举基类

## 注意事项
- 所有业务异常应使用 `AppException` 而非原始 `Exception`，确保前端能正确解析错误码
- `status_code` 默认值为 500，建议根据错误类型传入合适的 HTTP 状态码
- `ErrorCode` 继承 `str`，可以直接用于字符串比较和 JSON 序列化
- 与 `constants.py` 中的 `ERROR_PREFIXES` 列表配合使用，`ERROR_PREFIXES` 用于错误码前缀的快速分类
- 新增错误类型时，需要同时在 `ErrorCode` 枚举和 `ERROR_PREFIXES` 中添加