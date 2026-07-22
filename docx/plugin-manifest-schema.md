# 插件 Manifest Schema 设计 v2

> v1 → v2 变更：条件字段(visible_when)、流式输出(execute_stream)、Jinja2 模板变量、隔离机制澄清(v1 asyncio/v2 subprocess)、HTTP 域名白名单、配置迁移(config_migration)、ID 冲突规则、插件依赖声明、transform 脚本安全。

---

## 一、插件类型总览

| 类型 | 作用 | 对 Agent 的影响 | 典型例子 |
|------|------|----------------|---------|
| **工具插件** (tool) | 让 Agent 调用外部系统 | 暴露 OpenAI function-calling 格式的工具定义，Agent 可自行决定何时调用 | Jira 创建工单、GitHub 查 PR、飞书发消息 |
| **能力插件** (capability) | 增强 Agent 的专业能力 | 注入系统提示词扩展 + 对 Agent 产出做后处理 | 代码审查、需求分析、测试用例生成 |

一个插件包只能是一种类型。如果需要同时提供工具和能力，拆成两个插件。

---

## 二、目录结构

```
# 内置插件
ipd_engine/plugins/builtin/
├── jira/
│   ├── manifest.json
│   ├── plugin.py
│   ├── requirements.txt      # 可选
│   └── icon.png               # 可选，128x128
├── github/
│   ├── manifest.json
│   ├── plugin.py
│   └── icon.png
├── feishu/
│   ├── manifest.json
│   ├── plugin.py
│   └── icon.png
├── code_review/
│   ├── manifest.json
│   ├── plugin.py
│   └── prompts/
│       └── review_checklist.j2
└── test_gen/
    ├── manifest.json
    └── plugin.py

# 用户插件
~/.ipd-agents/plugins/
└── my-custom-plugin/
    ├── manifest.json
    └── plugin.py
```

插件发现规则：
- 扫描目录下所有包含 `manifest.json` 的子文件夹
- 文件夹名不重要，以 `manifest.json` 中的 `id` 为准
- `manifest.json` 和 `plugin.py` 是必需的，其余文件可选

---

## 三-B、插件依赖与 ID 冲突

### 3.3 插件依赖

如果一个插件依赖另一个插件（比如"Jira 报告生成"依赖"Jira 集成"的工具），通过 `dependencies` 声明：

```json
{
  "dependencies": {
    "jira": ">=1.0.0",
    "github": ">=2.0.0,<3.0.0"
  }
}
```

| 规则 | 说明 |
|------|------|
| 版本约束 | 支持 `>=1.0.0`, `>1.0.0`, `<2.0.0`, `=1.2.3`, `^1.0.0`, `~1.2.0` |
| 依赖解析 | 引擎在启用插件时检查所有依赖是否已安装且版本满足约束 |
| 缺失依赖 | 拒绝启用，提示用户先安装缺失的依赖插件 |
| 循环依赖 | 安装时检测，拒绝安装 |
| 依赖升级 | 升级被依赖插件时，检查所有依赖方是否兼容，不兼容时警告 |

### 3.4 ID 冲突规则

当 builtin 和 user 目录同时存在相同 `id` 的插件时：

```
优先级: 用户插件 > 内置插件

具体行为:
- 用户目录有 id="jira" → 屏蔽内置的同名插件
- 插件管理页面显示"已覆盖内置版本"，标注来源为用户目录
- 卸载用户版本后，内置版本自动恢复可用
- 两个用户目录下的同名插件：按发现顺序，先加载的优先，后加载的跳过并记录警告日志
```

这样用户可以用自己的修改版替换内置插件，同时保留回退能力。

### 3.5 插件发现规则（更新）

### 3.1 顶层结构

```json
{
  "id": "jira",
  "name": "Jira 集成",
  "version": "1.2.0",
  "type": "tool",
  "description": "连接 Jira，让 Agent 可以创建、查询、更新工单",
  "author": {"name": "Business Logic Agent", "email": "dev@ipd-agent.app"},
  "license": "MIT",
  "homepage": "https://ipd-agent.app/plugins/jira",
  "icon": "icon.png",
  "min_engine_version": "1.0.0",
  "max_engine_version": null,
  "dependencies": {},
  "config_schema": { ... },
  "config_migration": null,
  "tool_definitions": { ... },
  "capability_definitions": { ... },
  "permissions": ["http:*.atlassian.net", "http:*.atl-paas.net", "secret.store"],
  "runtime": { ... }
}
```

### 3.2 字段详解

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识，小写字母+数字+下划线，最长 64 字符。与文件夹名无关 |
| `name` | string | ✅ | 人类可读名称，最长 32 字符 |
| `version` | string | ✅ | 语义化版本 `major.minor.patch` |
| `type` | string | ✅ | `"tool"` 或 `"capability"` |
| `description` | string | ✅ | 一句话描述插件功能，最长 200 字符。显示在插件市场卡片上 |
| `author` | object | ✅ | `name` 必填，`email` 和 `url` 可选 |
| `license` | string | ❌ | SPDX 标识符，如 `"MIT"`, `"Apache-2.0"` |
| `homepage` | string | ❌ | 插件主页或文档链接 |
| `icon` | string | ❌ | 图标文件路径（相对于插件目录），默认用内置占位图标 |
| `min_engine_version` | string | ❌ | 要求引擎最低版本，不满足时拒绝加载 |
| `max_engine_version` | string | ❌ | 已知不兼容的引擎版本，不填表示无上限 |
| `config_schema` | object | ❌ | JSON Schema 格式的配置项定义，不需要配置的插件可省略 |
| `config_migration` | object | ❌ | 配置迁移规则，用于插件升级时自动迁移旧配置。见 §11.3 |
| `dependencies` | object | ❌ | 依赖的其他插件。见 §3.3 |
| `tool_definitions` | object | type=tool 必填 | 工具定义列表，见 §4 |
| `capability_definitions` | object | type=capability 必填 | 能力定义，见 §5 |
| `permissions` | array | ✅ | 所需权限列表，见 §8 |
| `runtime` | object | ❌ | 运行时约束，见 §9 |

---

## 四、工具插件定义（type=tool）

### 4.1 tool_definitions 结构

```json
{
  "tool_definitions": {
    "tools": [
      {
        "name": "jira_create_issue",
        "description": "在 Jira 项目中创建新工单",
        "parameters": {
          "type": "object",
          "properties": {
            "project_key": {
              "type": "string",
              "description": "Jira 项目标识，如 'PROJ'"
            },
            "summary": {
              "type": "string",
              "description": "工单标题"
            },
            "description": {
              "type": "string",
              "description": "工单详细描述，支持 Jira markdown"
            },
            "issue_type": {
              "type": "string",
              "enum": ["Bug", "Task", "Story", "Epic"],
              "description": "工单类型"
            },
            "priority": {
              "type": "string",
              "enum": ["Highest", "High", "Medium", "Low", "Lowest"],
              "description": "优先级"
            },
            "assignee": {
              "type": "string",
              "description": "指派人用户名，不填则不指派"
            },
            "labels": {
              "type": "array",
              "items": {"type": "string"},
              "description": "标签列表"
            }
          },
          "required": ["project_key", "summary", "issue_type"]
        },
        "dangerous": false,
        "requires_user_approval": false,
        "supports_streaming": false
      },
      {
        "name": "jira_delete_issue",
        "description": "删除 Jira 工单（不可恢复）",
        "parameters": {
          "type": "object",
          "properties": {
            "issue_key": {
              "type": "string",
              "description": "工单标识，如 'PROJ-123'"
            }
          },
          "required": ["issue_key"]
        },
        "dangerous": true,
        "requires_user_approval": true,
        "supports_streaming": false
      },
      {
        "name": "jira_trigger_build",
        "description": "触发 Jira 关联的 CI 构建流水线。构建过程较长，会流式返回进度。",
        "parameters": {
          "type": "object",
          "properties": {
            "issue_key": {"type": "string", "description": "关联工单标识"},
            "branch": {"type": "string", "description": "构建分支名"}
          },
          "required": ["issue_key", "branch"]
        },
        "dangerous": false,
        "requires_user_approval": true,
        "supports_streaming": true
      }
    ]
  }
}
```

### 4.2 工具定义字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 工具名称，即 function name。全局唯一，建议 `插件id_动词_名词` 命名 |
| `description` | string | 工具用途描述。**这是 LLM 决定何时调用工具的关键依据**，要写清楚"什么时候用、什么时候不用" |
| `parameters` | object | JSON Schema 格式的参数定义。引擎会自动转换为 OpenAI function-calling 的 `parameters` 字段 |
| `dangerous` | bool | 是否为危险操作（删除、修改权限、发送消息等）。危险操作在 UI 上高亮标记 |
| `requires_user_approval` | bool | 调用前是否需要用户确认。即使设为 false，用户也可以在项目设置中全局要求所有工具调用需确认 |
| `supports_streaming` | bool | 是否支持流式输出。设为 true 时，插件必须实现 `execute_stream()` 方法，引擎通过 WebSocket/SSE 逐条推送进度。默认 false |

### 4.3 参数描述最佳实践

```
❌ 差: "project_key": "项目key"
✅ 好: "project_key": "Jira 项目标识，如 'PROJ'。在 Jira 项目页面的 URL 中可以找到"

❌ 差: "description": "描述"
✅ 好: "description": "工单详细描述，支持 Jira markdown 格式。不需要重复标题内容"
```

LLM 靠这些描述来决定传什么参数，描述越具体，Agent 调用越准确。

---

## 五、能力插件定义（type=capability）

### 5.1 capability_definitions 结构

```json
{
  "capability_definitions": {
    "prompt_extension": "你是一位资深代码审查专家。当前项目是 {{project_name}}，处于 {{stage_name}} 阶段。在审查代码时，重点关注：\n1. 安全漏洞（OWASP Top 10）\n2. 性能瓶颈\n3. 代码可维护性\n4. 错误处理是否完善\n\n审查时请逐文件给出意见，每条意见标注严重程度（致命/严重/建议）。",
    "applicable_roles": ["rd"],
    "applicable_stages": ["develop", "verify"],
    "post_process": { ... }
  }
}
```

### 5.2 能力定义字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `prompt_extension` | string | 注入到 Agent 系统提示词末尾的额外指令。**支持 Jinja2 模板变量**，可用变量与 Agent 系统提示词相同（`{{project_name}}`, `{{stage_name}}`, `{{current_activity}}` 等，完整列表见 agent-system-prompts.md §一）。引擎在注入前用当前上下文渲染模板 |
| `applicable_roles` | array | 适用于哪些角色。不填表示所有角色。如代码审查通常只对研发 Agent 有意义 |
| `applicable_stages` | array | 适用于哪些阶段。不填表示所有阶段。如测试生成只在开发和验证阶段有用 |
| `post_process` | object | 可选，对 Agent 产出做后处理。不填则只注入提示词 |
| `post_process.type` | string | 后处理类型：`"structured_output"`（强制结构化输出）、`"validate"`（校验产出）、`"transform"`（转换产出） |
| `post_process.output_schema` | object | type=structured_output 时必填。JSON Schema 格式，引擎用 constrained decoding 强制 Agent 按此格式输出 |

### 5.3 后处理类型详解

**structured_output** — 强制 Agent 按 schema 输出：
```
引擎行为：将 output_schema 转为 LLM 的 response_format（如 GPT 的 json_schema），
确保 Agent 输出的 JSON 严格符合定义。如果 LLM 不支持 constrained decoding，
则在解析时做 Pydantic 校验，不合格自动重试（最多 2 次）。
```

**validate** — 校验 Agent 产出：
```json
{
  "post_process": {
    "type": "validate",
    "validation_rules": [
      {"field": "overall_score", "rule": "gte", "value": 0},
      {"field": "overall_score", "rule": "lte", "value": 100},
      {"field": "issues", "rule": "not_empty"}
    ]
  }
}
```

**transform** — 转换 Agent 产出：
```json
{
  "post_process": {
    "type": "transform",
    "transform_script": "post_process.py",
    "transform_function": "add_timestamps"
  }
}
```

**安全约束**：
- `transform_script` 指向的文件必须是插件目录内的 `.py` 文件，不允许 `../` 路径穿越
- 引擎在加载时计算文件的 SHA256 哈希，记录到数据库
- 每次执行前校验哈希，不匹配则拒绝执行并通知用户"插件脚本已被修改"
- 插件升级后哈希自动更新（因为升级是用户主动操作）

---

## 六、plugin.py 规范

### 6.1 工具插件基类

```python
# plugin.py

from ipd_engine.plugins.base import BaseToolPlugin, ToolResult

class Plugin(BaseToolPlugin):
    """Jira 集成插件"""

    def __init__(self, config: dict):
        """
        config 是用户在 UI 中填写的配置（根据 manifest.json 的 config_schema 生成表单）。
        密钥类字段已由引擎自动解密后传入。
        """
        self.base_url = config["base_url"]
        self.email = config["email"]
        self.api_token = config["api_token"]  # 引擎已自动解密

    async def execute(self, tool_name: str, params: dict) -> ToolResult:
        """
        执行工具调用（普通模式，一次性返回结果）。

        参数:
            tool_name: manifest.json 中定义的 tool name
            params: LLM 生成的参数

        返回:
            ToolResult(success=True, data=...) 或 ToolResult(success=False, error="...")
        """
        if tool_name == "jira_create_issue":
            return await self._create_issue(params)
        elif tool_name == "jira_delete_issue":
            return await self._delete_issue(params)
        else:
            return ToolResult(success=False, error=f"未知工具: {tool_name}")

    async def execute_stream(self, tool_name: str, params: dict) -> AsyncIterator[ToolStreamChunk]:
        """
        执行工具调用（流式模式，逐条返回进度）。

        仅当 manifest.json 中对应工具的 supports_streaming 为 true 时才会调用此方法。
        引擎将每个 chunk 通过 WebSocket/SSE 实时推送给前端。

        返回:
            AsyncIterator[ToolStreamChunk]，每个 chunk 包含进度信息
        """
        if tool_name == "jira_trigger_build":
            async for chunk in self._trigger_build_stream(params):
                yield chunk
        else:
            yield ToolStreamChunk(
                status="error",
                message=f"工具 '{tool_name}' 不支持流式输出",
                progress=0
            )

    async def _create_issue(self, params: dict) -> ToolResult:
        import httpx
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{self.base_url}/rest/api/3/issue",
                    json={
                        "fields": {
                            "project": {"key": params["project_key"]},
                            "summary": params["summary"],
                            "description": {
                                "type": "doc",
                                "version": 1,
                                "content": [
                                    {"type": "paragraph", "content": [
                                        {"type": "text", "text": params.get("description", "")}
                                    ]}
                                ]
                            },
                            "issuetype": {"name": params["issue_type"]},
                            "priority": {"name": params.get("priority", "Medium")}
                        }
                    },
                    auth=(self.email, self.api_token),
                    headers={"Accept": "application/json"}
                )
                resp.raise_for_status()
                data = resp.json()
                return ToolResult(
                    success=True,
                    data={
                        "issue_key": data["key"],
                        "url": f"{self.base_url}/browse/{data['key']}"
                    }
                )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
```

### 6.2 能力插件基类

```python
# plugin.py

from ipd_engine.plugins.base import BaseCapabilityPlugin, CapabilityResult

class Plugin(BaseCapabilityPlugin):
    """代码审查能力插件"""

    def __init__(self, config: dict):
        self.strict_mode = config.get("strict_mode", False)

    async def process(
        self, agent_output: str, context: dict
    ) -> CapabilityResult:
        """
        对 Agent 产出做后处理。

        参数:
            agent_output: Agent 的原始文本输出
            context: 当前上下文（project_id, stage_name, agent_role 等）

        返回:
            CapabilityResult(processed_output=..., metadata=...)
        """
        # 从原始输出中提取结构化数据
        import json, re

        # 尝试提取 JSON 块
        json_match = re.search(r'```json\n(.*?)\n```', agent_output, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                return CapabilityResult(
                    processed_output=agent_output,
                    metadata={"parsed": True, "issue_count": len(data.get("issues", []))}
                )
            except json.JSONDecodeError:
                pass

        return CapabilityResult(
            processed_output=agent_output,
            metadata={"parsed": False, "warning": "无法解析为结构化数据"}
        )
```

### 6.3 类命名约定

- 插件类名必须是 `Plugin`，引擎按此名称查找
- 一个 `plugin.py` 只能有一个 `Plugin` 类
- 辅助类和函数可以自由命名

### 6.4 基类定义（引擎侧）

```python
# ipd_engine/plugins/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

@dataclass
class ToolResult:
    success: bool
    data: dict | None = None
    error: str | None = None
    # 帮助 LLM 理解结果
    human_readable: str | None = None

@dataclass
class ToolStreamChunk:
    """流式输出的单个进度块"""
    status: str          # "running" | "progress" | "done" | "error"
    message: str         # 人类可读的进度描述，如 "正在编译...", "构建完成"
    progress: int        # 0-100 百分比，无法估算时传 -1
    data: dict | None = None  # 最终结果数据（仅 status=done 时有值）
    error: str | None = None  # 错误信息（仅 status=error 时有值）

@dataclass
class CapabilityResult:
    processed_output: str
    metadata: dict = field(default_factory=dict)

class BaseToolPlugin(ABC):
    """工具插件基类"""
    def __init__(self, config: dict): ...
    
    @abstractmethod
    async def execute(self, tool_name: str, params: dict) -> ToolResult: ...
    
    async def execute_stream(self, tool_name: str, params: dict) -> AsyncIterator[ToolStreamChunk]:
        """可选：流式执行。默认实现为 yield 一个 done chunk 后调用普通 execute"""
        result = await self.execute(tool_name, params)
        if result.success:
            yield ToolStreamChunk(status="done", message="完成", progress=100, data=result.data)
        else:
            yield ToolStreamChunk(status="error", message=result.error or "未知错误", progress=0, error=result.error)
    
    def health_check(self) -> bool:
        """可选：健康检查。返回 False 则插件标记为 degraded"""
        return True
    
    async def cleanup(self):
        """可选：插件卸载时释放资源"""
        pass

class BaseCapabilityPlugin(ABC):
    """能力插件基类"""
    def __init__(self, config: dict): ...
    
    @abstractmethod
    async def process(self, agent_output: str, context: dict) -> CapabilityResult: ...
    
    async def cleanup(self):
        pass
```

---

## 七、config_schema — 配置项定义

### 7.1 结构

```json
{
  "config_schema": {
    "type": "object",
    "properties": {
      "base_url": {
        "type": "string",
        "title": "Jira 地址",
        "description": "你的 Jira 实例 URL，如 https://company.atlassian.net",
        "default": "https://.atlassian.net",
        "format": "uri",
        "order": 1
      },
      "auth_type": {
        "type": "string",
        "title": "认证方式",
        "enum": ["api_token", "oauth"],
        "default": "api_token",
        "order": 2,
        "description": "选择 API Token（简单）或 OAuth（更安全，需要先注册应用）"
      },
      "email": {
        "type": "string",
        "title": "邮箱",
        "description": "Jira 账号邮箱",
        "format": "email",
        "order": 3,
        "visible_when": {"auth_type": "api_token"}
      },
      "api_token": {
        "type": "string",
        "title": "API Token",
        "description": "在 https://id.atlassian.com/manage-profile/security/api-tokens 生成",
        "format": "password",
        "secret": true,
        "order": 4,
        "visible_when": {"auth_type": "api_token"}
      },
      "client_id": {
        "type": "string",
        "title": "OAuth Client ID",
        "description": "OAuth 应用的 Client ID",
        "order": 5,
        "visible_when": {"auth_type": "oauth"}
      },
      "client_secret": {
        "type": "string",
        "title": "OAuth Client Secret",
        "format": "password",
        "secret": true,
        "order": 6,
        "visible_when": {"auth_type": "oauth"}
      },
      "project_key": {
        "type": "string",
        "title": "默认项目",
        "description": "默认 Jira 项目标识",
        "order": 7
      }
    },
    "required": ["base_url", "auth_type"]
  }
}
```

### 7.2 字段类型

| type | 前端渲染 | 说明 |
|------|---------|------|
| `string` | 文本输入框 | 可配合 `format` 做校验（email, uri, hostname） |
| `number` | 数字输入框 | 可配合 `minimum`/`maximum` |
| `integer` | 整数输入框 | |
| `boolean` | 开关 | |
| `enum` | 下拉选择 | 配合 `enum: ["a", "b", "c"]` |
| `string(format: "password")` | 密码输入框 | 配合 `secret: true` |
| `string(format: "textarea")` | 多行文本 | |
| `string(format: "file")` | 文件选择器 | 用于证书等文件上传 |

### 7.3 扩展属性

| 属性 | 用途 |
|------|------|
| `secret: true` | 标记为密钥。存储时用 Fernet 加密，API 返回时脱敏（`***`），仅传给插件实例时解密 |
| `order` | UI 排序（从小到大） |
| `visible_when` | 条件显示。值为 `{"字段名": "值"}`，只有当前面字段等于指定值时，此字段才显示。支持多条件 AND：`{"auth_type": "oauth", "advanced_mode": true}` |
| `advanced: true` | 标记为高级设置，默认折叠 |
| `sensitive: true` | 配置变更时需要用户重新确认（如变更 API 地址可能影响正在使用的功能） |

### 7.4 前端表单生成规则

```
1. 按 order 排序
2. 必填项（在 required 中）标红色星号
3. secret 字段显示为密码框，已填写时显示占位符 "已设置" + [修改] 按钮
4. 有 visible_when 的字段：监听依赖字段的值变化，条件满足时显示/隐藏
5. 条件隐藏的字段如果有已填值，切换回来时保留（不清空）
6. advanced 字段折叠在"高级设置"区域
7. 有 default 值时预填
8. 校验规则从前端双重校验（JSON Schema + HTML5 validation）
```

---

## 八、权限系统

### 8.1 权限列表

| 权限 | 说明 | 示例插件 |
|------|------|---------|
| `http` | 发起 HTTP 请求到任意域名（不推荐，优先用域名白名单） | 极少使用 |
| `http:<pattern>` | 发起 HTTP 请求到匹配域名的地址。支持通配符 `*` | `http:*.atlassian.net`, `http:api.github.com` |
| `file.read` | 读取用户文件系统 | 读取本地代码仓库的代码审查插件 |
| `file.write` | 写入用户文件系统 | 导出报告到本地 |
| `secret.store` | 使用密钥存储服务 | 所有需要 API Token 的插件 |
| `notification` | 发送系统通知 | 飞书/钉钉消息通知 |
| `process.spawn` | 启动子进程 | 运行 CLI 工具的插件 |
| `database.access` | 访问项目数据库 | 导出项目数据的插件 |

### 8.2 域名白名单规则

```
http:*.atlassian.net      → 匹配 company.atlassian.net, api.atlassian.net
http:api.github.com        → 仅匹配 api.github.com（精确）
http:localhost:*           → 匹配 localhost 任意端口
http:192.168.*             → 匹配内网 IP 段

引擎在执行 HTTP 请求前检查 URL 的 hostname 是否匹配白名单。
- 不匹配 → 拒绝请求，记录审计日志
- 插件声明了 http（不带域名限制）→ 安装时黄色警告"此插件可访问任意网站"
```

### 8.3 权限声明与确认

```json
{
  "permissions": ["http:*.atlassian.net", "http:*.atl-paas.net", "secret.store"]
}
```

**安装流程**：
1. 用户安装插件时，弹出权限确认对话框
2. 权限按敏感度分级展示：`file.write` 和 `process.spawn` 标红警告
3. 用户确认后，权限记录到数据库
4. 插件运行时，引擎检查权限：请求未声明的权限 → 拒绝并记录审计日志
5. 插件更新后如果新增权限，需要用户重新确认

### 8.4 权限确认 UI

```
┌─────────────────────────────────────────────────┐
│ 安装 "Jira 集成" v1.2.0                          │
│                                                  │
│ 此插件需要以下权限：                              │
│                                                  │
│ ✅ 发起 HTTP 请求                                 │
│    允许域名: *.atlassian.net, *.atl-paas.net      │
│    用于连接 Jira API                              │
│                                                  │
│ ✅ 使用密钥存储                                   │
│    API Token 将加密存储在本地                     │
│                                                  │
│ 此插件不会：                                     │
│ - 读取你的文件                                    │
│ - 发送系统通知                                    │
│ - 访问你的本地网络以外的地址                      │
│                                                  │
│ [取消] [确认安装]                                 │
└─────────────────────────────────────────────────┘
```

---

## 九、运行时约束

### 9.1 runtime 字段

```json
{
  "runtime": {
    "timeout_seconds": 30,
    "max_retries": 2,
    "retry_delay_seconds": 1,
    "concurrency": "single"
  }
}
```

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `timeout_seconds` | 30 | 单次 execute/process 调用的超时时间。超时后取消 task |
| `max_retries` | 2 | 超时或临时错误时的重试次数。不可重试的错误（如 401 认证失败）不重试 |
| `retry_delay_seconds` | 1 | 重试间隔 |
| `concurrency` | `"single"` | `"single"` 表示同时只能有一个实例在执行。目前不支持并发，预留字段 |

### 9.2 隔离机制

**v1 方案（当前）：asyncio Task**

```
每个插件在自己的 asyncio Task 中运行。
Task 被 asyncio.wait_for() 包裹，超时后触发 CancelledError。
插件异常不会传播到引擎主循环。
连续失败 5 次 → 自动禁用插件 → 通知用户。

优点: 零开销，部署简单
缺点: 共享 Python 进程内存，恶意/有 bug 的插件可能影响引擎稳定性
适用: 内置插件 + 信任来源的插件
```

**v2 方案（计划）：subprocess 进程隔离**

```
每个插件在独立子进程中运行，通过 JSON-RPC over stdio 通信。

┌──────────────────┐    JSON-RPC (stdio)    ┌──────────────────┐
│   引擎主进程      │ ◄────────────────────► │   插件子进程       │
│   (FastAPI)      │   method + params       │   (plugin.py)     │
│                  │   result + error        │                   │
│   内存隔离        │                         │   独立 Python     │
│   密钥在引擎侧    │                         │   无密钥访问      │
└──────────────────┘                         └──────────────────┘

插件只能通过 JSON-RPC 调用引擎提供的有限 API：
- http_request(method, url, headers, body)  → 由引擎代理发出（检查域名白名单）
- secret_get(key)                            → 引擎解密后返回
- log(level, message)                        → 写入引擎日志

优点: 完全内存隔离，插件崩溃不影响引擎，可限制网络/文件系统访问
缺点: 启动延迟 ~200ms，每次调用需要序列化/反序列化
适用: 用户安装的第三方插件
```

**迁移路径**：
- v1 内置插件保持 asyncio Task（性能优先，来源可信）
- v1 用户插件默认 asyncio Task，提供 `"isolation": "subprocess"` 选项
- v2 用户插件默认 subprocess，内置插件可选 asyncio Task
- manifest.json 不感知隔离方式，引擎根据插件来源自动选择

### ⚠️ v1 安全风险

> **审查发现**：v1 的 asyncio Task 隔离方案中，插件与引擎共享 Python 进程内存。`transform_script` 可以访问引擎内存中的所有数据（包括已解密的密钥、数据库连接、其他项目的上下文）。在迁移到 v2 之前，仅允许内置插件使用 `transform_script`，用户插件必须禁用此功能。

**迁移时间线**：
- **MVP（v1.0）**：仅内置插件，asyncio Task，`transform_script` 仅内置可用
- **v1.1**：用户插件支持，asyncio Task，无 `transform_script`
- **v2.0**：用户插件默认 subprocess，内置插件可选保留 asyncio Task

此设计与 `security-architecture-v2.md` 中的进程隔离策略保持一致。

---

## 十、MVP 范围边界（v2 新增）

> **审查发现**：插件系统设计了依赖解析、配置迁移、插件市场等复杂功能，但 MVP 阶段连一个真实插件都没有验证过。v2 明确 MVP 边界。

### MVP 包含（P0）

| 功能 | 说明 |
|------|------|
| manifest.json 加载与校验 | Pydantic 模型校验 |
| BaseToolPlugin / BaseCapabilityPlugin 基类 | 最简实现 |
| PluginManager 发现 + 加载 + 生命周期 | 内置插件目录扫描 |
| 3 个内置工具插件 | Jira / GitHub / 飞书（硬编码，不需要市场） |
| 配置表单自动生成 | 基于 config_schema |
| 权限声明与安装确认 | 基础版 |

### MVP 不包含（推迟）

| 功能 | 推迟原因 |
|------|---------|
| 插件市场 | 无用户基数，无开发者生态 |
| 插件依赖解析 | 内置插件无依赖 |
| 配置迁移（config_migration） | 插件版本还不到需要迁移的阶段 |
| subprocess 进程隔离 | v1.1 或 v2.0 |
| 用户自定义插件开发文档 | 有真实用户需求后再写 |
| 能力插件的 transform_script | 安全风险，v2 subprocess 隔离后再开放 |

---

## 十一、完整示例

### 10.1 工具插件：GitHub 集成

**manifest.json**：
```json
{
  "id": "github",
  "name": "GitHub 集成",
  "version": "1.0.0",
  "type": "tool",
  "description": "连接 GitHub，让 Agent 可以查询 Issue、PR 和代码仓库信息",
  "author": {"name": "Business Logic Agent", "email": "dev@ipd-agent.app"},
  "license": "MIT",
  "icon": "icon.png",
  "min_engine_version": "1.0.0",
  "config_schema": {
    "type": "object",
    "properties": {
      "token": {
        "type": "string",
        "title": "Personal Access Token",
        "description": "GitHub 个人访问令牌。在 Settings > Developer settings > Personal access tokens 生成",
        "format": "password",
        "secret": true
      },
      "organization": {
        "type": "string",
        "title": "组织名",
        "description": "默认 GitHub 组织（可选）"
      }
    },
    "required": ["token"]
  },
  "tool_definitions": {
    "tools": [
      {
        "name": "github_list_issues",
        "description": "列出指定仓库的 Issue。当用户需要查看项目待办事项或 Bug 列表时使用。",
        "parameters": {
          "type": "object",
          "properties": {
            "repo": {"type": "string", "description": "仓库全名，如 'owner/repo'"},
            "state": {"type": "string", "enum": ["open", "closed", "all"], "description": "Issue 状态"},
            "labels": {"type": "string", "description": "按标签过滤，逗号分隔"},
            "limit": {"type": "integer", "description": "返回数量，默认 10，最大 50"}
          },
          "required": ["repo"]
        },
        "dangerous": false,
        "requires_user_approval": false,
        "supports_streaming": false
      },
      {
        "name": "github_get_pr",
        "description": "获取指定 PR 的详细信息，包括变更文件列表和审查状态",
        "parameters": {
          "type": "object",
          "properties": {
            "repo": {"type": "string", "description": "仓库全名"},
            "pr_number": {"type": "integer", "description": "PR 编号"}
          },
          "required": ["repo", "pr_number"]
        },
        "dangerous": false,
        "requires_user_approval": false,
        "supports_streaming": false
      },
      {
        "name": "github_create_comment",
        "description": "在 Issue 或 PR 下添加评论。用于 Agent 自动回复代码审查意见。",
        "parameters": {
          "type": "object",
          "properties": {
            "repo": {"type": "string", "description": "仓库全名"},
            "issue_number": {"type": "integer", "description": "Issue 或 PR 编号"},
            "body": {"type": "string", "description": "评论内容，支持 Markdown"}
          },
          "required": ["repo", "issue_number", "body"]
        },
        "dangerous": false,
        "requires_user_approval": true,
        "supports_streaming": false
      }
    ]
  },
  "permissions": ["http:api.github.com", "secret.store"],
  "runtime": {"timeout_seconds": 30, "max_retries": 2}
}
```

**plugin.py**：
```python
from ipd_engine.plugins.base import BaseToolPlugin, ToolResult

class Plugin(BaseToolPlugin):
    def __init__(self, config: dict):
        self.token = config["token"]
        self.org = config.get("organization", "")
        self.api_base = "https://api.github.com"

    async def execute(self, tool_name: str, params: dict) -> ToolResult:
        handlers = {
            "github_list_issues": self._list_issues,
            "github_get_pr": self._get_pr,
            "github_create_comment": self._create_comment,
        }
        handler = handlers.get(tool_name)
        if not handler:
            return ToolResult(success=False, error=f"未知工具: {tool_name}")
        try:
            return await handler(params)
        except Exception as e:
            return ToolResult(success=False, error=str(e))

    async def _list_issues(self, params: dict) -> ToolResult:
        import httpx
        repo = params["repo"]
        state = params.get("state", "open")
        limit = min(params.get("limit", 10), 50)
        labels = params.get("labels", "")

        url = f"{self.api_base}/repos/{repo}/issues"
        qs = f"?state={state}&per_page={limit}"
        if labels:
            qs += f"&labels={labels}"

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                url + qs,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json"
                }
            )
            resp.raise_for_status()
            issues = [
                {"number": i["number"], "title": i["title"],
                 "state": i["state"], "url": i["html_url"],
                 "labels": [l["name"] for l in i["labels"]]}
                for i in resp.json()
            ]
            return ToolResult(success=True, data={"issues": issues, "count": len(issues)})

    async def _get_pr(self, params: dict) -> ToolResult:
        import httpx
        url = f"{self.api_base}/repos/{params['repo']}/pulls/{params['pr_number']}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json"
                }
            )
            resp.raise_for_status()
            pr = resp.json()
            return ToolResult(success=True, data={
                "title": pr["title"],
                "state": pr["state"],
                "user": pr["user"]["login"],
                "base_branch": pr["base"]["ref"],
                "head_branch": pr["head"]["ref"],
                "url": pr["html_url"],
                "body": pr.get("body", "")
            })

    async def _create_comment(self, params: dict) -> ToolResult:
        import httpx
        url = f"{self.api_base}/repos/{params['repo']}/issues/{params['issue_number']}/comments"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json={"body": params["body"]},
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json"
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return ToolResult(success=True, data={
                "id": data["id"],
                "url": data["html_url"]
            })
```

### 10.2 能力插件：需求分析

**manifest.json**：
```json
{
  "id": "requirement_analysis",
  "name": "需求分析增强",
  "version": "1.0.0",
  "type": "capability",
  "description": "增强产品经理的需求分析能力：自动检查需求的完整性、一致性和可测试性",
  "author": {"name": "Business Logic Agent"},
  "license": "MIT",
  "min_engine_version": "1.0.0",
  "config_schema": {
    "type": "object",
    "properties": {
      "strictness": {
        "type": "string",
        "title": "严格程度",
        "enum": ["宽松", "标准", "严格"],
        "default": "标准",
        "order": 1,
        "description": "宽松=只检查致命遗漏，标准=检查完整性+一致性，严格=额外检查可测试性和优先级合理性"
      }
    }
  },
  "capability_definitions": {
    "prompt_extension": "当前项目是 {{project_name}}，处于 {{stage_name}} 阶段。在撰写需求文档时，请额外检查以下维度：\n\n## 需求完整性检查清单\n1. 每个功能需求是否都有对应的验收标准？\n2. 是否考虑了异常路径（网络断开、数据为空、权限不足）？\n3. 是否明确了非功能需求（性能、安全、兼容性）？\n4. 是否有与其他系统的交互边界定义？\n\n## 需求一致性检查\n- P0/P1/P2 优先级划分是否有明确依据？\n- 是否有相互矛盾的需求（如\"极致省电\"和\"实时同步\"）？\n\n## 可测试性检查\n- 每个需求是否可以用一个具体的测试用例来验证？\n- 如果没有，说明为什么不可测试，以及替代验证方式。",
    "applicable_roles": ["product_manager"],
    "applicable_stages": ["concept", "plan"],
    "post_process": {
      "type": "structured_output",
      "output_schema": {
        "type": "object",
        "properties": {
          "requirements": {"type": "array", "items": {"type": "object", "properties": {
            "id": {"type": "string"},
            "description": {"type": "string"},
            "priority": {"enum": ["P0", "P1", "P2"]},
            "acceptance_criteria": {"type": "array", "items": {"type": "string"}},
            "completeness_score": {"type": "integer", "minimum": 0, "maximum": 100},
            "gaps": {"type": "array", "items": {"type": "string"}}
          }, "required": ["id", "description", "priority"]}},
          "consistency_report": {
            "conflicts": {"type": "array", "items": {"type": "object", "properties": {
              "requirement_a": {"type": "string"},
              "requirement_b": {"type": "string"},
              "conflict_description": {"type": "string"}
            }}}
          },
          "overall_score": {"type": "integer", "minimum": 0, "maximum": 100}
        },
        "required": ["requirements", "overall_score"]
      }
    }
  },
  "permissions": []
}
```

---

## 十二、插件生命周期

### 12.1 状态机

```
                    ┌──────────┐
        安装 →      │ disabled │
                    └────┬─────┘
                    [启用]
                         ↓
                    ┌──────────┐
                    │ enabled  │
                    └────┬─────┘
          ┌──────────────┼──────────────┐
     [连续失败5次]   [手动禁用]    [卸载]
          ↓              ↓              ↓
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ degraded │   │ disabled │   │ removed  │
    └──────────┘   └──────────┘   └──────────┘
```

### 12.2 各阶段行为

| 阶段 | 行为 |
|------|------|
| **安装** | 复制插件文件夹 → 读取 manifest.json → 校验 schema → 权限确认 → 记录数据库 → 状态=disabled |
| **启用** | 加载 plugin.py → 实例化 Plugin(config) → 校验 config 有效性 → 状态=enabled |
| **禁用** | 取消所有正在执行的 task → 调用 cleanup() → 状态=disabled。Agent 提示词中移除该插件的注入 |
| **配置** | 更新配置 → 重新实例化 Plugin(new_config)。不需要重启引擎 |
| **升级** | 覆盖文件夹 → 重新加载 manifest.json → 检查 config_migration → 自动迁移配置 → 重新实例化。如果新增权限，需用户确认 |
| **卸载** | 禁用 → 删除文件夹 → 删除数据库记录。不影响已产生的历史数据 |

### 12.3 配置迁移（config_migration）

插件升级时，如果新版 config_schema 的字段名/结构有变化，通过 `config_migration` 声明迁移规则，引擎自动转换用户已保存的旧配置。

```json
{
  "config_migration": {
    "from_version": "1.0.0",
    "description": "v2.0 重构了认证配置，将 email+api_token 合并为 credential 对象",
    "map": {
      "email": "credential.email",
      "api_token": "credential.api_token"
    },
    "remove": ["deprecated_field_1", "deprecated_field_2"],
    "defaults": {
      "credential.auth_type": "basic",
      "retry_count": 3
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `from_version` | 此迁移规则适用的最低旧版本。引擎会链式执行多条迁移（如 1.0→1.1→2.0） |
| `map` | 字段名映射。`"旧字段名": "新字段名"`，支持点号路径（`a.b.c`）访问嵌套对象 |
| `remove` | 不再需要的旧字段，迁移后删除 |
| `defaults` | 新增字段的默认值（旧配置里没有的字段用此值填充） |

**迁移流程**：
```
1. 引擎检测版本变更: 已安装 v1.0.0 → 新版本 v2.0.0
2. 查找 from_version <= 旧版本 < 新版本 的所有迁移规则
3. 按版本顺序链式执行:
   a. 按 map 重命名字段
   b. 按 remove 删除废弃字段
   c. 按 defaults 填充新增字段
4. 迁移后的配置用新 config_schema 校验
5. 校验通过 → 保存新配置 + 记录迁移日志
6. 校验失败 → 保留旧配置，通知用户手动迁移
```

**迁移失败处理**：
- 迁移后的配置不合法 → 插件保持 disabled，显示"配置需要手动更新"
- 用户在 UI 看到新旧配置对比，手动调整后保存
- 不影响插件文件夹（新版本已安装），只阻塞启用

---

## 十三、插件管理器 API

插件管理器负责插件的发现、加载、生命周期管理和隔离执行。

```python
# ipd_engine/plugins/manager.py

class PluginManager:
    """插件管理器 — 单例"""

    def __init__(self):
        self._plugins: dict[str, PluginInstance] = {}
        self._builtin_dir = Path("ipd_engine/plugins/builtin")
        self._user_dir = Path.home() / ".ipd-agents" / "plugins"

    async def discover(self) -> list[PluginManifest]:
        """扫描所有目录，返回发现的插件清单"""
        manifests = []
        for directory in [self._builtin_dir, self._user_dir]:
            if directory.exists():
                for plugin_dir in directory.iterdir():
                    manifest_path = plugin_dir / "manifest.json"
                    if manifest_path.exists():
                        manifest = self._load_manifest(manifest_path)
                        manifests.append(manifest)
        return manifests

    async def install(self, plugin_path: Path) -> PluginManifest:
        """从路径安装插件"""

    async def uninstall(self, plugin_id: str):
        """卸载插件"""

    async def enable(self, plugin_id: str, config: dict):
        """启用插件：加载 plugin.py，实例化 Plugin 类"""

    async def disable(self, plugin_id: str):
        """禁用插件"""

    async def execute_tool(self, plugin_id: str, tool_name: str, params: dict) -> ToolResult:
        """执行工具插件调用（带超时和错误处理）"""

    async def apply_capability(self, plugin_id: str, agent_output: str, context: dict) -> CapabilityResult:
        """应用能力插件后处理"""

    def get_prompt_extensions(self, role_id: str, stage_name: str) -> list[str]:
        """获取当前角色+阶段适用的所有能力插件提示词扩展"""

    def get_tool_definitions(self, plugin_id: str) -> list[dict]:
        """获取工具插件的 OpenAI function-calling 格式工具定义"""
```

---

## 十四、与现有设计的对接

### 14.1 API 端点（已在 api-design.md 定义）

```
GET    /api/plugins                           # 已安装插件列表
POST   /api/plugins                           # 安装插件
POST   /api/plugins/{id}/enable               # 启用
POST   /api/plugins/{id}/disable              # 禁用
PATCH  /api/plugins/{id}/config               # 更新配置
DELETE /api/plugins/{id}                      # 卸载
GET    /api/plugins/marketplace                # 插件市场
```

### 14.2 Agent 系统对接

```
Agent 启动时:
1. PluginManager.get_prompt_extensions(role_id, stage_name) → 注入到系统提示词
2. PluginManager.get_tool_definitions() → 合并到 LLM function-calling tools 列表

Agent 运行时:
3. LLM 返回 function_call → PluginManager.execute_tool() → 返回结果给 LLM
4. Agent 产出后 → PluginManager.apply_capability() → 后处理产出
```

### 14.3 前端对接

```
插件管理页面:
- 插件卡片网格（图标、名称、描述、版本、状态开关）
- 点击进入插件详情（配置表单、工具列表/能力说明、运行日志）

Agent 配置页面:
- 每个 Agent 可选择启用哪些能力插件
- 工具插件默认所有 Agent 可用，Agent 自行决定何时调用
```

---

## 十五、设计原则总结

| 原则 | 说明 |
|------|------|
| **零代码安装** | 用户只需丢文件夹 + 点确认，不需要写任何代码 |
| **安全优先** | 权限显式声明 + 安装确认 + 密钥加密存储 + 沙箱隔离执行 |
| **声明即所得** | manifest.json 的 config_schema 自动生成 UI 表单，tool_definitions 自动注入 LLM |
| **失败隔离** | 插件崩溃不影响引擎，连续失败自动熔断 |
| **热更新** | 启用/禁用/配置变更不需要重启引擎 |
| **版本兼容** | min/max_engine_version 确保插件与引擎兼容 |
| **双轨统一** | 工具和能力共用同一套 manifest 结构，减少学习成本 |

---

## 十六、实施优先级

| 优先级 | 内容 |
|--------|------|
| P0 | manifest.json Schema 定义 + 校验（Pydantic 模型） |
| P0 | BaseToolPlugin / BaseCapabilityPlugin 基类 |
| P0 | PluginManager 发现 + 加载 + 生命周期 |
| P0 | 3 个内置工具插件（Jira, GitHub, 飞书）— 硬编码，无需市场 |
| P1 | 配置表单自动生成（前端） |
| P1 | 权限系统 + 安装确认流程 |
| P2 | 2 个内置能力插件（代码审查, 需求分析） |
| P2 | 用户自定义插件支持 |
| P3 | 插件市场前端页面 |
| P3 | subprocess 进程隔离 |
| P3 | 插件依赖解析 + 配置迁移 |
