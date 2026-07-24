# M9: 用量追踪 — CLAUDE.md

> **模块编号**：M9
> **模块名称**：用量追踪
> **负责 Agent**：全栈开发 C
> **开发周期**：Week 5-6
> **上游依赖**：M0（基础设施）、M1（认证安全）、M4（Agent 编排）
> **下游被依赖**：M12（Dashboard）、M18（用量与设置页）

---

## 职责范围

M9 负责 LLM Token 消耗和成本统计：
1. **Token 计数**：每次 LLM 调用的 input/output token 记录
2. **成本计算**：根据模型单价计算费用
3. **用量统计**：按项目/日期/模型维度的用量聚合
4. **预算预警**：项目花费接近预算上限时提醒
5. **用量限制**：可配置每日/每月 Token 上限
6. **用量报告**：生成用量摘要（项目维度 + 全局维度）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 用量数据 CRUD |
| 认证中间件 | M1 | 用户身份 |
| Agent 编排 | M4 | 接收每次 LLM 调用的 token 数据 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/usage/projects/{id}` | GET | 项目用量统计 |
| `/api/usage/summary` | GET | 全局用量摘要 |
| `/api/usage/daily` | GET | 每日用量趋势 |
| `/api/usage/limits` | GET/PUT | 用量限制配置 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 用量路由 |
| `usage_service.py` | 用量统计业务逻辑 |
| `token_counter.py` | Token 计数（tiktoken） |
| `cost_calculator.py` | 成本计算（模型单价 × token 数） |
| `budget_alerter.py` | 预算预警（80% 提醒，100% 阻止） |
| `usage_limiter.py` | 用量限制器 |
| `models.py` | Pydantic 模型 |

---

## 模型单价（参考）

| 模型 | 输入价格 ($/1M token) | 输出价格 ($/1M token) |
|------|---------------------|----------------------|
| Ollama (本地) | 免费 | 免费 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |

---

## 预算预警规则

- 花费达到预算 80%：黄色提醒（不阻塞）
- 花费达到预算 100%：红色警告 + 阻止新的 LLM 调用（用户可手动解除）
- 预算偏差 > 15%（实际 vs 计划）：侧边栏预算小组件变红

---

## 数据库表

- `usage_records`：用量记录（id, project_id, model, input_tokens, output_tokens, cost_usd, created_at）
- `usage_limits`：用量限制（id, limit_type, max_tokens, period, is_active）

---

## 技能集成

### 可调用的 Skill
- **`ipd-data-analysis`**：生成用量数据的统计分析

### 分析场景
| 分析类型 | 用途 | 数据来源 |
|---------|------|---------|
| Token 消耗趋势 | 按天/周/月分析 Token 消耗趋势 | `usage_records` 表 |
| 成本分布分析 | 按模型/项目/Agent 分析成本分布 | `usage_records` + `cost_rates` |
| 预算执行分析 | 分析预算执行情况，预测超支风险 | `budget` + `actual_cost` |
| 模型效率分析 | 各模型性价比分析（成本/Token/质量） | `usage_records` + `quality_scores` |

---

## 完成标准

- [ ] 每次 LLM 调用的 token 用量正确记录
- [ ] 成本计算准确（模型单价 × token 数）
- [ ] 项目用量统计可用（按日期/模型聚合）
- [ ] 预算预警在 80% 和 100% 正确触发
- [ ] 用量限制可配置并生效
- [ ] Ollama 本地调用 token 记录为 0 成本但记录用量
- [ ] 用量报告生成正确（项目维度 + 全局维度）
- [ ] 用量分析数据通过 `ipd-data-analysis` 生成

---

## 禁止事项

1. **禁止遗漏 LLM 调用的用量记录**（每次调用必须记录，即使 Ollama 也记录 token 数）
2. **禁止成本计算忽略 output token**（output token 通常更贵）
3. **禁止预算预警静默失败**（预警必须同时推送通知和更新侧边栏小组件）
4. **禁止用量限制可以被前端绕过**（限制在后端强制校验）
5. **禁止用量记录无项目关联**（每条记录必须关联 project_id）
6. **禁止硬编码模型单价**（从配置文件读取）
