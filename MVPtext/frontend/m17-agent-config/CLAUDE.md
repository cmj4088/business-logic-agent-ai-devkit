# M17: Agent 配置页 — CLAUDE.md

> **模块编号**：M17
> **模块名称**：Agent 配置页（前端）
> **负责 Agent**：全栈开发 F
> **开发周期**：Week 5-6
> **上游依赖**：M3（提示词系统）、M4（Agent 编排）
> **下游被依赖**：无（独立页面）

---

## 职责范围

M17 负责 Agent 和 LLM 模型的配置页面：
1. **LLM 模型选择**：选择默认 LLM 后端（Ollama / Anthropic / OpenAI）
2. **API Key 配置**：Anthropic/OpenAI API Key 的输入和加密存储
3. **Ollama 连接配置**：Ollama 服务地址和可用模型列表
4. **模型测试**：测试 LLM 连接是否正常
5. **Agent 角色配置**：查看/修改 6 个 Agent 角色的系统提示词
6. **提示词模板预览**：预览渲染后的 system prompt
7. **DataExportNotice 集成**：配置云端 API 时弹出数据出境告知
8. **模型参数调整**：temperature、max_tokens 等参数（高级选项）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| API 客户端 | shared/api-client.ts | Agent 配置 API |
| AuthContext | M11 | 用户信息 |
| DataExportNotice | shared 组件 | 数据出境告知 |
| 类型定义 | shared/types.ts | Agent 角色类型 |

---

## 输出接口

| 输出 | 类型 | 说明 |
|------|------|------|
| `/settings/agents` | Route | Agent 配置页面 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `index.tsx` | Agent 配置页入口 |
| `components/ModelSelector.tsx` | LLM 模型选择器 |
| `components/ApiKeyConfig.tsx` | API Key 配置面板 |
| `components/OllamaConfig.tsx` | Ollama 连接配置 |
| `components/ModelTestPanel.tsx` | 模型连接测试 |
| `components/AgentRoleList.tsx` | Agent 角色列表 |
| `components/AgentRoleEditor.tsx` | 角色提示词编辑器 |
| `components/PromptPreview.tsx` | 提示词渲染预览 |
| `components/ModelParamsPanel.tsx` | 模型参数面板（temperature 等） |
| `components/DataExportNotice.tsx` | 数据出境告知弹窗 |
| `hooks/useAgentConfig.ts` | Agent 配置 Hook |
| `hooks/useModelTest.ts` | 模型测试 Hook |
| `api.ts` | Agent 配置 API 调用 |
| `types.ts` | Agent 配置相关类型 |

---

## 页面布局

```
┌──────────────────────────────────────────────────────────┐
│ ⚙️ Agent 配置                                             │
│                                                          │
│ ┌─ LLM 后端 ────────────────────────────────────────────┐│
│ │                                                        ││
│ │ 默认后端:  ○ Ollama（本地，数据不出境）← 推荐            ││
│ │            ○ Anthropic（云端）                          ││
│ │            ○ OpenAI（云端）                             ││
│ │                                                        ││
│ │ Ollama 服务地址: [http://localhost:11434        ] [测试]││
│ │ 可用模型: llama3.2 (3B), qwen2.5 (7B), ...    [刷新]   ││
│ │ 默认模型: [qwen2.5 ▼]                                  ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 云端 API（高级选项）──────────────────────────────────┐│
│ │ Anthropic API Key: [••••••••••••••••••••] [显示] [测试] ││
│ │ OpenAI API Key:    [                            ] [测试] ││
│ │                                                        ││
│ │ ⚠️ 使用云端 API 意味着数据将被发送到境外服务器。          ││
│ │ [查看数据出境说明]                                       ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Agent 角色 ──────────────────────────────────────────┐│
│ │ 产品经理  [查看提示词] [测试]  研发架构师  [查看提示词]  ││
│ │ 测试专家  [查看提示词] [测试]  市场专家    [查看提示词]  ││
│ │ 制造工程师 [查看提示词] [测试] 财务分析师  [查看提示词]  ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 高级参数 ────────────────────────────────────────────┐│
│ │ Temperature: [0.7        ]  (0.0 - 2.0)               ││
│ │ Max Tokens:  [32000      ]  (1024 - 128000)           ││
│ └────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## 关键交互

### DataExportNotice 触发时机
```
用户输入 Anthropic/OpenAI API Key 并点击"测试"或"保存"时
  → 弹出 DataExportNotice
  → 显示: 数据发送目的地、数据类型、用途
  → 用户必须勾选"我已阅读并同意"才能启用
  → 不同意则无法使用云端 API
```

### 模型测试
```
点击"测试"按钮
  → 发送简单测试 prompt
  → 显示测试结果（成功/失败 + 延迟 + Token 数）
  → 失败时显示错误详情和建议
```

---

## 技能集成

### 技能管理面板

M17 需要在 Agent 配置页中增加技能管理功能，使每个 Agent 角色可用的 Skill 可视化并可配置：

| 配置区域 | 功能 | 说明 |
|---------|------|------|
| Agent 角色卡片 | 展示每个 Agent 可用的 Skill 列表 | 每个 Skill 显示名称 + 简短描述 + 启用/禁用开关 |
| 技能详情面板 | 点击 Skill 名称查看详情 | 显示 Skill 的触发条件、生成内容格式、依赖数据 |
| 全局技能开关 | 一键启用/禁用所有 Skill | 位于页面顶部，方便快速调试 |

### 技能与 Agent 角色映射（配置页展示）

| Agent 角色 | 可用 Skill | 默认启用 |
|-----------|-----------|---------|
| `product_manager`（产品经理） | `ipd-docx` | ✅ 启用 |
| `rd`（研发架构师） | `ipd-xlsx`、`ipd-docx` | ✅ 启用 |
| `qa`（测试专家） | `ipd-data-analysis` | ✅ 启用 |
| `marketing`（市场专家） | `ipd-data-analysis` | ✅ 启用 |
| `manufacturing`（制造工程师） | `ipd-xlsx` | ✅ 启用 |
| `finance`（财务分析师） | `ipd-data-analysis`、`ipd-xlsx` | ✅ 启用 |

### 技能配置 UI 示例

```
┌─ Agent 角色配置 ──────────────────────────────────────────┐
│                                                            │
│ 🤵 产品经理                                                 │
│   可用技能:                                                 │
│   ☑ 📄 ipd-docx — Word 文档生成（MRD/PRD/商业论证）         │
│   [查看提示词] [测试 Agent]                                  │
│                                                            │
│ 🔧 研发架构师                                               │
│   可用技能:                                                 │
│   ☑ 📊 ipd-xlsx — Excel 文件生成（BOM/进度表）              │
│   ☑ 📄 ipd-docx — Word 文档生成（技术方案/评审报告）         │
│   [查看提示词] [测试 Agent]                                  │
│                                                            │
│ 📊 财务分析师                                               │
│   可用技能:                                                 │
│   ☑ 📈 ipd-data-analysis — 数据分析（财务 ROI/预算分析）    │
│   ☑ 📊 ipd-xlsx — Excel 文件生成（预算表/成本核算表）        │
│   [查看提示词] [测试 Agent]                                  │
│                                                            │
│ [全局启用所有技能] [全局禁用所有技能]                         │
└────────────────────────────────────────────────────────────┘
```

### 技能状态持久化

- 每个 Agent 角色的技能启用状态通过 API 保存到后端
- 后端 M7 插件系统根据启用状态决定是否注册对应 tool
- 技能状态变更即时生效，无需重启 Agent
- 默认所有技能启用，用户可随时调整

## 完成标准

- [ ] LLM 后端选择器可用（Ollama/Anthropic/OpenAI）
- [ ] Ollama 连接配置和模型列表可用
- [ ] API Key 加密存储（通过 Electron secureStore）
- [ ] 模型连接测试功能可用
- [ ] 6 个 Agent 角色提示词可查看
- [ ] 提示词渲染预览可用
- [ ] DataExportNotice 在配置云端 API 时正确弹出
- [ ] 模型参数可调整
- [ ] **每个 Agent 角色正确显示可用 Skill 列表**
- [ ] **Skill 启用/禁用开关正常工作**
- [ ] **技能状态变更后即时生效**
- [ ] **全局技能启用/禁用按钮可用**

---

## 禁止事项

1. **禁止 API Key 明文显示**（默认掩码，点击"显示"后才展示）
2. **禁止 API Key 明文存储在 localStorage**（必须 Electron secureStore）
3. **禁止配置云端 API 时不弹出 DataExportNotice**
4. **禁止 DataExportNotice 可以不经勾选同意就关闭**
5. **禁止修改提示词后不保留历史版本**
6. **禁止 Ollama 不可用时静默失败**（必须明确提示"无法连接到 Ollama"）
7. **禁止允许用户删除或禁用所有 Agent 角色**（至少保留默认 6 个）
