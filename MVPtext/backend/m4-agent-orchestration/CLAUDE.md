# M4: Agent 编排 — CLAUDE.md

> **模块编号**：M4
> **模块名称**：Agent 编排
> **负责 Agent**：后端开发 B
> **开发周期**：Week 3-6
> **上游依赖**：M0（基础设施）、M1（认证安全）、M2（工作流引擎）、M3（提示词系统）
> **下游被依赖**：M5（产出物管理）、M7（插件系统）、M8（实时通信）、M9（用量追踪）、M10（异常恢复）、M17（Agent 配置页）

---

## 职责范围

M4 是 Agent 协作的调度中心，负责：
1. **编排模式**：实现 3 种 Agent 协作模式（parallel/sequential/debate）
2. **LLM 调用**：统一的 LLM 调用接口，支持 Ollama/Anthropic/OpenAI
3. **LLM Router**：自动降级切换（Ollama → Anthropic → OpenAI → Ollama）
4. **死循环检测**：debate 模式连续 3 轮无新观点自动终止
5. **熔断器**：连续 5 次 LLM 失败触发熔断，10 分钟后自动重试
6. **推理摘要**：生成 Agent 推理过程的中文摘要
7. **Token 管理**：max_tokens 截断，防止超长输出
8. **语言检测**：检测 LLM 输出是否非中文，触发重试
9. **格式解析**：JSON 输出解析（失败时重试 2 次 → 降级为纯文本）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | Agent 配置和轮次存储 |
| 认证中间件 | M1 | 用户身份 |
| 工作流引擎 | M2 | 获取当前阶段和活动 |
| 提示词渲染 | M3 | 渲染各角色的 system prompt |
| data_filter | shared | 数据过滤 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/agents/configs` | GET/POST | Agent 配置列表/创建 |
| `/api/agents/configs/{id}` | GET/PUT | Agent 配置详情/更新 |
| `/api/agents/orchestrate` | POST | 触发 Agent 协作 |
| `/api/agents/rounds/{id}` | GET | 获取协作轮次详情 |
| `/api/agents/rounds/{id}/messages` | GET | 获取轮次消息列表 |
| `/api/agents/models` | GET | 可用模型列表 |
| `/api/agents/models/test` | POST | 测试模型连接 |
| `Orchestrator.orchestrate(mode, agents, context)` | 函数 | 核心编排函数 |
| `LLMRouter.call(model, messages, **kwargs)` | 函数 | 统一 LLM 调用 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | Agent 配置和编排路由 |
| `orchestrator.py` | 编排器：parallel/sequential/debate 三种模式 |
| `executor.py` | Agent 执行器：单次 LLM 调用 |
| `llm_router.py` | LLM Router：模型选择、降级切换、熔断器 |
| `deadlock_detector.py` | 死循环检测（语义相似度计算） |
| `reasoning_summarizer.py` | 推理摘要生成 |
| `output_parser.py` | 输出解析（JSON 重试 + 纯文本降级） |
| `language_detector.py` | 语言检测（非中文触发重试） |
| `circuit_breaker.py` | 熔断器实现 |
| `models.py` | Pydantic 模型 |

---

## 三种编排模式

### 1. Parallel（并行）
```
所有 Agent 同时收到相同 prompt → 独立输出 → 合并结果
用途：竞品分析、风险评估（多视角独立判断）
```

### 2. Sequential（顺序）
```
Agent A 输出 → Agent B 基于 A 输出继续 → ... → 最终输出
用途：MRD 撰写、商业论证（需要链式推理）
主持人：默认第一个 Agent
```

### 3. Debate（辩论）
```
所有 Agent 同时发言 → 互相评论 → 多轮辩论 → 达成共识或主持人裁决
用途：技术方案选型、DFM 审查（需要多方博弈）
最大轮次：lite 2 轮, standard 3 轮, full 4 轮
终止条件：连续 3 轮无新观点（语义相似度 > 0.85）
```

---

## LLM Router 降级链

```
Ollama（本地默认，数据不出境）
  ↓ 连续 5 次失败
Anthropic（云端，需用户同意数据出境）
  ↓ 连续 5 次失败
OpenAI（云端，需用户同意数据出境）
  ↓ 连续 5 次失败
Ollama（回退本地，即使之前失败也重试）
```

---

## 技能集成

### 技能调度逻辑
在编排过程中，Orchestrator 需要根据活动类型自动触发对应的 Skill：

| 活动类型 | 触发 Skill | 触发时机 | 示例活动 |
|---------|-----------|---------|---------|
| `market_analysis` | `ipd-data-analysis` | 市场分析类活动前 | 竞品分析、TAM/SAM/SOM 估算 |
| `financial_analysis` | `ipd-data-analysis` | 财务分析类活动前 | ROI 计算、敏感性分析 |
| `quality_analysis` | `ipd-data-analysis` | 质量分析类活动前 | 缺陷率统计、测试通过率 |
| `bom_generation` | `ipd-xlsx` | BOM 生成类活动前 | 物料清单、成本核算 |
| `budget_planning` | `ipd-xlsx` | 预算规划类活动前 | 财务预算表、预算 vs 实际 |
| `schedule_planning` | `ipd-xlsx` | 进度规划类活动前 | 项目进度表、甘特图 |
| `document_generation` | `ipd-docx` | 文档生成类活动前 | MRD/PRD/技术方案 |

### 编排流程扩展
```
1. 从 M2 获取当前活动列表
2. 对每个活动，判断是否需要调用 Skill
   ├─ 需要 → 调用对应 Skill 生成数据/文档
   │        └─ 将 Skill 输出注入 Agent 上下文
   └─ 不需要 → 直接进入编排
3. 执行编排模式（parallel/sequential/debate）
4. Agent 推理时使用 Skill 输出作为参考
5. 编排完成后，将结果传递给 M5 保存为产出物
```

### 接口契约
```python
# 技能调用接口（在 orchestrator.py 中集成）
class SkillInput(BaseModel):
    skill_name: str  # "ipd-data-analysis" | "ipd-xlsx" | "ipd-docx"
    activity_type: str
    context: dict  # 项目上下文
    parameters: dict  # 技能参数

class SkillOutput(BaseModel):
    success: bool
    output_path: str | None  # 生成的文件路径
    summary: str  # 执行摘要
    data: dict | None  # 结构化数据

# 在编排前调用
async def call_skill(input: SkillInput) -> SkillOutput:
    """调用对应 Skill 并返回结果"""
    ...
```

---

## 完成标准

- [ ] 3 种编排模式全部可用（parallel/sequential/debate）
- [ ] LLM Router 降级切换正常（Ollama → Anthropic → OpenAI → Ollama）
- [ ] 熔断器在 5 次失败后触发，10 分钟后自动重试
- [ ] 死循环检测正确终止无新观点的辩论
- [ ] 推理摘要中文可读（非技术用户能理解）
- [ ] JSON 格式错误时重试 2 次后降级为纯文本
- [ ] 语言检测触发非中文重试
- [ ] 根据活动类型自动触发对应的 Skill
- [ ] Skill 输出正确注入 Agent 上下文
- [ ] 编排完成后结果正确传递给 M5

---

## 禁止事项

1. **禁止绕过 LLM Router 直接调用 LLM API**
2. **禁止在未过滤数据的情况下发送到 LLM**（必须经过 data_filter）
3. **禁止辩论无限进行**（必须有轮次上限和死循环检测）
4. **禁止在熔断器触发后继续调用失败的模型**
5. **禁止在 Ollama 模式下将数据发送到云端**
6. **禁止硬编码模型名称**（从配置读取）
7. **禁止在 Agent 输出中暴露系统提示词**
