# M10: 异常恢复 — CLAUDE.md

> **模块编号**：M10
> **模块名称**：异常恢复
> **负责 Agent**：后端开发 A
> **开发周期**：Week 5-6
> **上游依赖**：M0（基础设施）、M1（认证安全）、M4（Agent 编排）
> **下游被依赖**：M14b（项目联调）、M16（产出物编辑）

> **与 M4 职责边界**：M4 负责异常**检测**（死循环检测、熔断器触发、LLM 失败计数），M10 负责异常**恢复**（接收 M4 的异常事件 → 生成恢复选项 → 暴露给前端 RecoveryPanel → 执行用户选择的恢复动作）。M10 不重复实现 M4 的检测逻辑。

---

## 职责范围

M10 负责接收 M4 的异常事件并提供恢复机制：
1. **Agent 产出质量差**：提供重新生成/切换模型/版本对比选项
2. **辩论死循环**：接收 M4 的死循环检测事件 → 提供主持人裁决/重新讨论/带着分歧前进选项
3. **LLM API 不可用**：接收 M4 的熔断器事件 → 执行模型降级 + 通知用户 + 定时重试
4. **门禁反复不通过**：带着遗留问题前进 + 下一门禁检查
5. **恢复面板数据**：为前端 RecoveryPanel 提供可操作的恢复选项

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 恢复记录存储 |
| 认证中间件 | M1 | 用户身份 |
| Agent 编排 | M4 | 接收异常事件，触发恢复流程 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/recovery/status` | GET | 当前项目的恢复状态 |
| `/api/recovery/actions` | POST | 执行恢复动作 |
| `/api/recovery/debate/{round_id}/resolve` | POST | 辩论死锁裁决 |
| `/api/recovery/regenerate/{artifact_id}` | POST | 重新生成产出物 |
| `/api/recovery/proceed-with-issues` | POST | 带着遗留问题前进 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 异常恢复路由 |
| `recovery_manager.py` | 恢复管理器：统一调度 4 种恢复场景 |
| `debate_deadlock.py` | 辩论死循环检测和终止 |
| `quality_retry.py` | 产出物质量重试（切换 temperature/模型） |
| `llm_fallback.py` | LLM 降级策略 |
| `issue_carryover.py` | 遗留问题携带到下一门禁 |
| `models.py` | Pydantic 模型 |

---

## 四种异常场景详解

### 场景 1: Agent 产出质量差
```
触发: 用户点击"需要修改"或"驳回"
恢复:
  1. 用户选择"重新生成"
  2. 系统使用不同 temperature 或切换模型重新生成
  3. 新产出物创建为新版本（旧版本保留）
  4. 用户可对比新旧版本
```

### 场景 2: 辩论死循环
```
触发: 连续 3 轮无新观点（语义相似度 > 0.85）
恢复:
  1. 自动终止辩论
  2. 主持人 Agent 做总结裁决
  3. 用户可选：接受裁决 / 重新讨论 / 带着分歧前进
```

### 场景 3: LLM API 不可用
```
触发: 连续 5 次 LLM 调用失败
恢复:
  1. 熔断器触发
  2. LLM Router 自动切换备用模型
  3. 通知用户当前模型及影响
  4. 10 分钟后自动重试主模型
```

### 场景 4: 门禁反复不通过
```
触发: 同一门禁 2 次不通过
恢复:
  1. 提示"带着遗留问题前进"
  2. 遗留问题记录到下一门禁检查清单
  3. 当前阶段标记"有条件通过"
  4. 下一门禁必须检查遗留问题是否已关闭
```

---

## RecoveryAction 结构

```python
class RecoveryAction:
    type: str          # moderator_decide | restart | proceed | regenerate | model_fallback
    summary: str       # 人类可读的恢复建议
    options: list[str] # 用户可选的操作列表
    auto_retry_after: int | None  # 自动重试等待秒数
    metadata: dict     # 额外上下文
```

---

## 技能集成

### 技能执行异常的恢复处理

M10 需要识别 Skill 执行过程中的异常，并提供对应的恢复策略：

| 异常场景 | 触发条件 | 恢复策略 | 涉及 Skill |
|---------|---------|---------|-----------|
| 数据源不可用 | `ipd-data-analysis` 无法读取数据文件 | ① 提示用户提供数据文件<br>② 使用模拟数据生成示例分析<br>③ 跳过分析，输出空报告 | `ipd-data-analysis` |
| Excel 生成失败 | `ipd-xlsx` 写入文件异常 | ① 自动重试 1 次<br>② 切换为 CSV 格式输出<br>③ 输出结构化 JSON 数据替代 | `ipd-xlsx` |
| Word 模板渲染失败 | `ipd-docx` 模板引擎异常 | ① 切换为纯文本 Markdown 输出<br>② 降级为简单文档结构<br>③ 跳过格式，输出原始内容 | `ipd-docx` |
| Skill 超时 | Skill 执行超过 60 秒 | ① 终止当前 Skill 调用<br>② 通知用户超时原因<br>③ 提供手动执行选项（下载模板自行填写） | 全部 |

### 恢复动作集成

在 `RecoveryAction` 结构体中增加 Skill 相关恢复类型：

```python
# 扩展 RecoveryAction 类型
class RecoveryAction:
    type: str          # moderator_decide | restart | proceed | regenerate | 
                       # model_fallback | **skill_retry** | **skill_fallback** | 
                       # **skill_skip**
    summary: str       # 人类可读的恢复建议
    options: list[str] # 用户可选的操作列表
    auto_retry_after: int | None  # 自动重试等待秒数
    metadata: dict     # 额外上下文（含 skill_name, artifact_id 等）
```

### 恢复流程示例

```
Skill 执行超时（> 60 秒）
  → M10 检测到超时异常
  → 生成 RecoveryAction:
      type: "skill_retry"
      summary: "BOM成本表生成超时，请选择操作"
      options: ["重新生成", "下载空模板自行填写", "跳过此产出物"]
  → 推送到前端 RecoveryPanel
  → 用户选择"重新生成"
  → M10 通知 M4 重新触发 Skill 调用
  → 新尝试使用更小的数据集或更简单的格式
```

## 完成标准

- [ ] 4 种异常场景的恢复流程全部可用
- [ ] 辩论死循环检测准确（语义相似度 > 0.85 触发）
- [ ] 重新生成产出物时旧版本保留
- [ ] LLM 降级后 10 分钟自动重试主模型
- [ ] 遗留问题正确携带到下一门禁
- [ ] RecoveryPanel 前端能正确渲染恢复选项
- [ ] **Skill 执行异常检测覆盖全部 3 个 Skill（数据源/Excel/Word）**
- [ ] **Skill 超时机制生效（60 秒自动终止）**
- [ ] **Skill 恢复动作正确推送到前端 RecoveryPanel**

---

## 禁止事项

1. **禁止异常恢复静默执行**（用户必须知晓发生了什么和系统做了什么）
2. **禁止恢复操作不可撤销**（重新生成保留旧版本，裁决可推翻）
3. **禁止遗留问题被下一门禁忽略**（下一门禁必须显示并检查遗留问题）
4. **禁止熔断器触发后手动绕过**（熔断期间禁止调用对应模型）
5. **禁止在恢复流程中丢失审计日志**
6. **禁止无限重试 LLM**（最多 3 次重试 + 熔断器保护）
