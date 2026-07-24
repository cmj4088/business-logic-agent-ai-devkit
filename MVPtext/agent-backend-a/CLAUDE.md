# Agent: 后端开发 A — 任务分配

> **角色**：后端开发 A
> **负责模块**：M0（基础设施）、M1（认证与安全）、M10（异常恢复）
> **开发周期**：Week 1-4
> **技能使用**：无（不直接使用 Skill）

---

## 一、M0 — 基础设施

### 任务清单
- [ ] FastAPI 应用初始化、路由注册、中间件注册
- [ ] SQLite 连接池、WAL 模式配置、建表迁移（v001-v006）
- [ ] 配置管理（config.yaml + 环境变量）
- [ ] structlog 结构化日志初始化
- [ ] `GET /api/health` 健康检查端点
- [ ] startup/shutdown 事件处理

### 输入依赖
| 依赖 | 来源 |
|------|------|
| 无 | 基础模块 |

### 输出接口
| 接口 | 说明 |
|------|------|
| FastAPI app 实例 | 注册路由 |
| 数据库会话 | CRUD 操作 |
| 配置对象 | 全局配置 |
| 日志 | 结构化日志 |

### 技能使用
- 无（基础模块不依赖 Skill）

---

## 二、M1 — 认证与安全

### 任务清单
- [ ] 用户注册/登录（邮箱+密码，JWT Token）
- [ ] Token 管理（Session 15 分钟 + Refresh 30 天）
- [ ] 密码安全（bcrypt 哈希，≥8位含数字+字母）
- [ ] API Key 管理（Fernet 加密存储 Anthropic/OpenAI Key）
- [ ] 安全中间件（认证、CORS、Rate Limiting）
- [ ] 会话管理（token 黑名单）

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 配置对象 | M0 |
| 日志 | M0 |

### 输出接口
| 接口 | 说明 |
|------|------|
| 认证中间件 | 用户身份校验 |
| Token 管理 | 签发/验证/刷新/黑名单 |
| API Key 加密存储 | 提供给 M17 前端配置页 |

### 技能使用
- 无（认证模块不依赖 Skill）

---

## 三、M10 — 异常恢复

### 任务清单
- [ ] 死循环检测（debate 模式语义相似度 > 0.85 终止）
- [ ] 熔断器（连续 5 次 LLM 失败 → 10 分钟自动重试）
- [ ] 降级策略（Ollama 失败 → Anthropic → OpenAI → Ollama）
- [ ] 格式降级（JSON 解析失败 2 次 → 纯文本降级）
- [ ] 语言降级（非中文输出 → 自动重试）
- [ ] 异常恢复面板数据接口

### 技能集成任务
- [ ] **Skill 超时检测**：3 个 Skill 执行超过 60 秒自动终止
- [ ] **Skill 恢复策略**：
  - `ipd-data-analysis` 数据源不可用 → 模拟数据/跳过
  - `ipd-xlsx` 写入异常 → 重试 → CSV 降级 → JSON 替代
  - `ipd-docx` 模板渲染失败 → Markdown 降级 → 原始内容
- [ ] **RecoveryAction 扩展**：增加 `skill_retry` / `skill_fallback` / `skill_skip` 类型

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 认证中间件 | M1 |
| Agent 编排异常事件 | M4 |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/recovery/status` | GET | 当前项目的恢复状态 |
| `/api/recovery/actions` | POST | 执行恢复动作 |
| `/api/recovery/debate/{round_id}/resolve` | POST | 辩论死锁裁决 |
| `/api/recovery/regenerate/{artifact_id}` | POST | 重新生成产出物 |
| `/api/recovery/proceed-with-issues` | POST | 带着遗留问题前进 |

### 技能使用
| 异常场景 | 触发条件 | 恢复策略 | 涉及 Skill |
|---------|---------|---------|-----------|
| 数据源不可用 | `ipd-data-analysis` 无法读取数据 | 模拟数据 → 跳过 | `ipd-data-analysis` |
| Excel 生成失败 | `ipd-xlsx` 写入异常 | 重试 → CSV → JSON | `ipd-xlsx` |
| Word 模板渲染失败 | `ipd-docx` 模板异常 | Markdown → 原始内容 | `ipd-docx` |
| Skill 超时 | 执行 > 60 秒 | 终止 → 通知 → 手动选项 | 全部 |

---

## 四、全局依赖关系

```
M0（基础设施）
  └─→ M1（认证与安全）
       └─→ M10（异常恢复）← M4（Agent 编排异常事件）
```

## 五、关键文件

| 模块 | 文件 | 说明 |
|------|------|------|
| M0 | `m0_infrastructure/main.py` | FastAPI 应用入口 |
| M0 | `m0_infrastructure/database.py` | 数据库初始化 |
| M0 | `m0_infrastructure/config.py` | 配置管理 |
| M0 | `m0_infrastructure/middleware.py` | 中间件 |
| M1 | `m1_auth_security/router.py` | 认证路由 |
| M1 | `m1_auth_security/auth_service.py` | 认证服务 |
| M1 | `m1_auth_security/security.py` | 安全工具 |
| M1 | `m1_auth_security/models.py` | 数据模型 |
| M10 | `m10_recovery/recovery_manager.py` | 恢复管理器 |
| M10 | `m10_recovery/debate_deadlock.py` | 辩论死循环 |
| M10 | `m10_recovery/quality_retry.py` | 质量重试 |
| M10 | `m10_recovery/llm_fallback.py` | LLM 降级 |
| M10 | `m10_recovery/issue_carryover.py` | 遗留问题携带 |

## 六、完成标准

- [ ] M0 全部任务完成（FastAPI 启动、数据库初始化、健康检查）
- [ ] M1 全部任务完成（注册登录、JWT、API Key 加密、安全中间件）
- [ ] M10 全部任务完成（4 种异常恢复场景）
- [ ] **M10 技能集成全部完成（3 个 Skill 的异常恢复策略）**
- [ ] 所有模块测试通过（单元测试覆盖率 ≥ 70%）
- [ ] 所有公开函数有 docstring
- [ ] 所有 SQL 参数化查询，无字符串拼接
- [ ] 日志无敏感信息输出

## 七、参考文档

- `docx/architecture-v5.md` — 系统架构设计
- `docx/api-design.md` — API 端点设计
- `docx/database-schema-v3.md` — 数据库 Schema
- `docx/security-architecture-v2.md` — 安全架构设计
- `MVPtext/CLAUDE.md` — 主开发规则
- `MVPtext/backend/m10-recovery/CLAUDE.md` — M10 模块详情