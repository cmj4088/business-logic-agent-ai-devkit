# M3: 提示词系统 — CLAUDE.md

> **模块编号**：M3
> **模块名称**：提示词系统
> **负责 Agent**：后端开发 B
> **开发周期**：Week 1-3
> **上游依赖**：M0（基础设施）、M1（认证安全）
> **下游被依赖**：M4（Agent 编排）、M17（Agent 配置页）

---

## 职责范围

M3 负责 Agent 系统提示词的管理和渲染：
1. **模板管理**：6 个 Agent 角色的 Jinja2 提示词模板（CRUD + 版本管理）
2. **模板渲染**：根据项目上下文渲染最终 system prompt
3. **上下文构建**：从项目、阶段、产出物中提取上下文变量
4. **数据过滤**：渲染前调用 `data_filter.py` 过滤敏感信息
5. **XML 标签包裹**：用户输入用 `<user_input>` 标签包裹（防 prompt injection 基础防护）
6. **结构隔离**：系统指令和用户输入严格分离

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 模板 CRUD |
| 日志 | M0 | 渲染日志 |
| 认证中间件 | M1 (`get_current_user`) | 用户身份 |
| data_filter | shared/data_filter.py | 敏感数据过滤 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/prompts/templates` | GET | 所有提示词模板列表 |
| `/api/prompts/templates/{role}` | GET/PUT | 角色模板详情/更新 |
| `/api/prompts/render` | POST | 渲染 system prompt（内部调用） |
| `render_system_prompt(role, context) -> str` | 函数 | 核心渲染函数 |
| `build_context(project_id, stage) -> dict` | 函数 | 构建渲染上下文 |
| `wrap_user_input(text: str) -> str` | 函数 | XML 标签包裹用户输入 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 提示词模板路由 |
| `prompt_service.py` | 模板管理和渲染服务 |
| `renderer.py` | Jinja2 渲染器 |
| `context_builder.py` | 上下文构建（项目/阶段/产出物/用户信息） |
| `input_guard.py` | 输入防护（XML 标签包裹 + data_filter 调用） |
| `models.py` | Pydantic 模型 |
| `templates/` | Jinja2 模板文件目录 |
| `templates/product_manager.j2` | 产品经理提示词 |
| `templates/rd.j2` | 研发架构师提示词 |
| `templates/qa.j2` | 测试专家提示词 |
| `templates/marketing.j2` | 市场专家提示词 |
| `templates/manufacturing.j2` | 制造工程师提示词 |
| `templates/finance.j2` | 财务分析师提示词 |

---

## 提示词模板结构（每个模板必须包含）

```jinja2
{# 角色定义 #}
你是一个{{ role_name }}，负责{{ role_responsibility }}。

{# 当前项目上下文 #}
## 项目信息
- 项目名称：{{ project.name }}
- 当前阶段：{{ stage.name }}
- 复杂度：{{ project.complexity_tier }}

{# 相关产出物 #}
## 已有产出物
{% for artifact in artifacts %}
- {{ artifact.name }}：{{ artifact.summary }}
{% endfor %}

{# 安全约束（所有模板必须包含） #}
## 安全约束
1. 你只能基于提供的上下文回答问题，不要编造数据
2. 如果信息不足，明确说明"需要更多信息"
3. 不要提供法律建议，涉及法律问题时标注"建议咨询专业律师"
4. 输出中不要包含任何个人身份信息（身份证号、手机号、邮箱等）
```

---

## XML 标签包裹规则

```python
# 所有用户输入必须包裹在 <user_input> 标签内
def wrap_user_input(text: str) -> str:
    return f"<user_input>\n{text}\n</user_input>"

# 系统指令放在 <system_instruction> 标签内
# LLM 仅遵循 <system_instruction> 中的指令
# <user_input> 中的内容只作为分析对象，不作为指令执行
```

---

## 技能集成

### 技能注入要求
在 6 个 Agent 角色的 Jinja2 模板中，必须为每个 Agent 注入对应的 Skill 调用指令：

| Agent 角色 | 可调用的 Skill | 注入位置 |
|-----------|-------------|---------|
| `product_manager` | `ipd-docx` | 文档生成相关指令区域 |
| `rd` | `ipd-xlsx`、`ipd-docx` | 技术文档/BOM 生成区域 |
| `qa` | `ipd-data-analysis` | 质量数据分析区域 |
| `marketing` | `ipd-data-analysis` | 市场数据分析区域 |
| `manufacturing` | `ipd-xlsx` | BOM 和供应链数据区域 |
| `finance` | `ipd-data-analysis`、`ipd-xlsx` | 财务分析/预算表区域 |

### 模板注入示例
```jinja2
{# 在 product_manager 模板中注入 ipd-docx 调用指令 #}
{% if skill_ipd_docx_enabled %}
## 文档生成能力
你可以使用 `ipd-docx` Skill 生成以下文档：
- MRD（市场需求文档）
- PRD（产品需求文档）
- 商业论证文档
当需要生成上述文档时，请使用该 Skill 生成格式规范的 .docx 文件。
{% endif %}
```

### 上下文变量扩展
在上下文构建时，需要额外提供以下变量：
- `skill_ipd_data_analysis_enabled`: bool — 数据分 Skill 是否启用
- `skill_ipd_xlsx_enabled`: bool — Excel Skill 是否启用
- `skill_ipd_docx_enabled`: bool — 文档 Skill 是否启用
- `available_skills`: list — 当前 Agent 可用的 Skill 列表

---

## 完成标准

- [ ] 6 个角色的 Jinja2 模板全部就绪
- [ ] 渲染函数能根据项目上下文正确渲染 system prompt
- [ ] data_filter 在渲染前正确过滤敏感信息
- [ ] XML 标签包裹正确（用户输入和系统指令隔离）
- [ ] 模板版本管理可用（更新后旧版本保留）
- [ ] 上下文变量完整（项目信息、阶段、产出物、Agent 角色）
- [ ] 6 个 Agent 模板均已注入对应的 Skill 调用指令
- [ ] 上下文变量包含 `skill_*_enabled` 和 `available_skills`
- [ ] Skill 启用/禁用状态从 M17 配置读取

---

## 禁止事项

1. **禁止在模板中硬编码具体数据**（必须使用 Jinja2 变量）
2. **禁止绕过 data_filter 渲染提示词**
3. **禁止将用户输入直接拼接到 system prompt**（必须 XML 标签包裹）
4. **禁止从用户输入加载 Jinja2 模板**（防 prompt injection：模板文件只从文件系统读取）
5. **禁止在提示词中要求 LLM 输出敏感信息**
6. **禁止模板中包含绝对路径或内部实现细节**
