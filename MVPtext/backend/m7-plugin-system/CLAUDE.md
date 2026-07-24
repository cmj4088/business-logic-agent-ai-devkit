# M7: 插件系统 — CLAUDE.md

> **模块编号**：M7
> **模块名称**：插件系统
> **负责 Agent**：全栈开发 F
> **开发周期**：Week 4-6
> **上游依赖**：M0（基础设施）、M1（认证安全）、M4（Agent 编排）
> **下游被依赖**：无（MVP 阶段无插件管理前端页面，API 为后端预留，供后续版本使用）

---

## 职责范围

M7 负责插件管理和 Agent 工具调用：
1. **插件 CRUD**：安装、卸载、启用、禁用插件
2. **内置插件**：MVP 阶段仅 1 个内置插件 `web_search`
3. **插件配置**：每个插件的配置管理（API Key 等）
4. **工具注册**：插件声明的 tools 注册到 Agent 可用工具列表
5. **插件清单**：基于 `plugin-manifest-schema.md` 校验插件定义
6. **安全沙箱**：插件调用隔离（超时、权限限制）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 插件数据 CRUD |
| 认证中间件 | M1 | 用户身份 |
| Agent 编排 | M4 | 注册插件 tools 到 Agent 可用工具列表 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/plugins` | GET | 已安装插件列表 |
| `/api/plugins/install` | POST | 安装插件 |
| `/api/plugins/{id}` | GET/PUT/DELETE | 插件详情/配置更新/卸载 |
| `/api/plugins/{id}/toggle` | POST | 启用/禁用插件 |
| `/api/plugins/available` | GET | 可用插件市场列表（MVP 仅 1 个） |
| `/api/plugins/{id}/test` | POST | 测试插件连接 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 插件路由 |
| `plugin_service.py` | 插件管理业务逻辑 |
| `plugin_registry.py` | 插件注册表（管理已安装插件） |
| `tool_bridge.py` | 工具桥接：将插件 tools 转换为 Agent 可调用格式 |
| `manifest_validator.py` | 插件清单校验（基于 plugin-manifest-schema.md） |
| `sandbox.py` | 插件调用安全沙箱（超时 30s、禁止文件系统访问） |
| `models.py` | Pydantic 模型 |

---

## 内置插件：web_search

```json
{
  "id": "web_search",
  "name": "网页搜索",
  "version": "1.0.0",
  "description": "允许 Agent 搜索互联网获取最新信息",
  "tools": [
    {
      "name": "search_web",
      "description": "搜索互联网获取信息",
      "parameters": {
        "query": { "type": "string", "description": "搜索关键词" },
        "max_results": { "type": "integer", "default": 5 }
      }
    }
  ],
  "config_schema": {
    "api_key": { "type": "string", "secret": true }
  }
}
```

---

## 数据库表

- `plugin_configs`：插件配置（id, plugin_id, name, version, enabled, config_json, installed_at）
- `plugin_tools`：插件工具注册表（id, plugin_id, tool_name, tool_schema）

---

## 技能集成

### 技能作为插件的扩展机制

M7 插件系统为 3 个内置 Skill 提供扩展框架，使 Skill 能够通过插件机制注册到 Agent 的可用工具列表中：

| 技能 | 插件注册方式 | 注册的 Tool |
|------|------------|------------|
| `ipd-data-analysis` | 通过 `plugin_registry` 注册为数据分析工具 | `analyze_data` |
| `ipd-xlsx` | 通过 `plugin_registry` 注册为 Excel 生成工具 | `generate_xlsx` |
| `ipd-docx` | 通过 `plugin_registry` 注册为 Word 生成工具 | `generate_docx` |

### 技能调用流程（通过插件系统）

```
Agent 编排决定需要生成文档
  → 调用 tool_bridge 将 Skill 注册为 tool
  → Agent 调用对应 tool（如 generate_docx）
  → tool_bridge 路由到对应 Skill 的 SKILL.md
  → Skill 执行生成逻辑
  → 产出物保存到 M5 产出物管理系统
  → 结果返回给 Agent
```

### tool_bridge 接口

```python
# tool_bridge.py — 将 Skill 注册为 Agent 可调用的 tool
class SkillTool:
    skill_name: str          # "ipd-data-analysis" | "ipd-xlsx" | "ipd-docx"
    tool_name: str           # Agent 调用时使用的 tool 名称
    description: str         # tool 描述（Agent 理解用途）
    parameters: dict         # JSON Schema 格式的参数定义
    execute: Callable        # 执行函数

def register_skill_as_tool(skill_name: str) -> SkillTool:
    """将 Skill 注册为 Agent 可调用的 tool"""
    ...

def get_skill_tools() -> list[SkillTool]:
    """获取所有已注册的 Skill tools"""
    ...
```

### 技能启停控制

插件系统的启用/禁用机制同样适用于 Skill：
- 在 Agent 配置页（M17）中控制每个 Agent 角色的 Skill 启用/禁用
- 禁用的 Skill 不会注册到 Agent 的 tool 列表中
- 默认所有 Skill 对所有适用 Agent 角色启用

## 完成标准

- [ ] 内置 web_search 插件安装和配置可用
- [ ] 插件启用/禁用切换正常
- [ ] Agent 能调用 web_search 工具
- [ ] 插件清单校验正确（非法清单拒绝安装）
- [ ] 插件调用超时保护（30 秒）
- [ ] 插件 API Key 加密存储
- [ ] **3 个 Skill 成功注册为 Agent 可调用的 tool**
- [ ] **Skill 调用结果正确保存到 M5 产出物管理系统**
- [ ] **Skill 启用/禁用开关在 Agent 配置页生效**

---

## 禁止事项

1. **禁止插件访问文件系统**（沙箱限制）
2. **禁止插件调用不受限制**（30 秒超时 + 最大 3 次/分钟频率限制）
3. **禁止安装未通过清单校验的插件**
4. **禁止插件 API Key 明文存储**（必须 Fernet 加密）
5. **禁止插件绕过 data_filter**（插件返回的数据在传给 LLM 前仍需过滤）
6. **MVP 阶段禁止开发超过 1 个内置插件**（web_search 足够验证架构）
