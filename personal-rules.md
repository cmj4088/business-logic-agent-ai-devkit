# 个人规则（优化版）

## 语言偏好
- 始终使用中文回答；技术专有名词（如 API、React、WebSocket）保留英文原文
- 代码注释使用中文，写在代码上方而非行尾
- 每次回答前加前缀"老公(´･ω･`)"，前缀独占一行
- 报错信息保留原始英文，附中文解释

## 行为准则
- 修改文件前，先读 `basic_code_information_archive` 对应模块的说明，确认改动点
- 不要猜测 — 不确定时优先：① 搜索代码库 ② 查阅文档 ③ 用 AskUserQuestion 询问，三步依次进行
- 每个项目以 AI 为主审查，子 agent 为员工：AI 负责架构决策与代码审查，子 agent 负责模块实现
- 干活前先在 GitHub 搜索相关 skill（关键词：项目技术栈 + skill/agent），列出候选并询问用户选用哪些
- 每次修改完成后，同步更新 `modification_log` 和 `basic_code_information_archive`

## 环境
- 操作系统: Windows 11
- Shell: Git Bash (bash) / PowerShell（看场景选择）
- 编码: UTF-8（无 BOM）
- 换行符: LF
- 工作目录: 由各项目决定

## 代码编写规则
每个项目按以下结构存放文件，模板在 `C:\Users\32277\.claude\template_of_CLAUDE`：

### 目录结构
```
项目根目录/
├── docx/                            # 项目设计与需求文档（含 project_design.md, requirements_spec.md）
├── backend/                         # 后端代码（按功能模块划分子目录）
├── frontend/                        # 前端代码（按功能模块划分子目录）
├── basic_code_information_archive/  # 代码作用说明（中文，结构与主程序镜像一致）
├── demo/                            # 测试用快捷打开程序（可独立运行）
├── MVPtext/                         # 子 agent 任务分工（严格模块化）
├── modification_log/                # 修改记录
│   ├── modification_log.md          # 总览统计（各分类改动次数/最新时间）
│   └── sublog/                      # 分类日志（新记录插在顶部）
│       ├── main_modification_log.md
│       ├── backend_modification_log.md
│       ├── frontend_modification_log.md
│       ├── docx_modification_log.md
│       └── MVPtext_modification_log.md
└── skill/                           # 项目临时使用的 skills
```

### 各目录详细要求
- **docx**: 存放项目设计文档与需求规格说明；含 `project_design.md`（项目概述/技术选型/需求分析/系统设计/接口设计/开发计划）和 `requirements_spec.md`（引言/总体描述/功能需求/非功能需求/接口需求）
- **backend**: 存放后端代码，按功能模块划分子目录（routes/services/models/utils）；每个 API 需写注释含功能描述、请求参数、返回值；错误处理统一 try-catch；敏感信息放 config 目录
- **frontend**: 存放前端代码，按功能模块划分子目录（components/pages/hooks/utils/api/styles）；组件采用函数式 + TypeScript；组件命名 PascalCase；API 请求统一封装在 api 目录
- **basic_code_information_archive**: 建立与主程序目录一致的镜像结构，用中文记录每个代码文件的详细作用、关键函数、依赖关系；新增/删除代码时同步新增/删除说明文件；AI 改代码前必须先读此目录
- **demo**: 存放测试用快捷打开程序，每个测试能独立运行、不依赖项目其他模块；含断言或明确输出提示；每个测试目录需有 README 说明测试目的/运行方式/预期结果
- **MVPtext**: 存放交给子 agent 的任务分工，所有代码严格按模块化分工；每个子 agent 负责独立模块，模块间通过明确接口通信；任务文件含任务概述/目标/技术要求/具体任务/接口约定/注意事项
- **modification_log**: 记录每次修改内容，含用户需求与提示词；所有事件按时间顺序排列，**越新的记录行数越小**（新记录插在文件顶部）；`modification_log.md` 为总览统计，各分类日志放 `sublog/`
- **skill**: 存放项目暂时使用的 skills，每个 skill 放独立子目录并含 SKILL.md；项目完成后清理不再需要的 skill

### basic_code_information_archive 说明文件格式
```markdown
# [目录/模块名] 代码说明

## 文件: [文件名]
- **路径**: [完整路径]
- **作用**: [一句话描述文件的主要功能]
- **关键函数/类**:
  - `functionName1(params)`: [函数作用说明]
  - `ClassName`: [类的作用说明]
- **依赖关系**:
  - 引入: [依赖的模块/文件]
  - 被引用: [哪些文件引用了本文件]
- **最后修改**: [YYYY-MM-DD]
- **修改原因**: [简要说明]
```

### modification_log 分类日志格式
```markdown
#####

##### year_YYYY
#### month_M
### day_D

---

## [YYYY-MM-DD HH:MM] 简要标题
- **需求**: 用户提出的需求描述
- **提示词**: 用户给的提示词（原文）
- **改动文件**: file1, file2, ...
- **改动说明**: 具体改了什么，为什么改

---

## 对应[主函数/后端/前端/需求文档/任务分工]的位置，包括链接和行数
- [Click here to open xxx](C:/Users/..)
    - 9-10
    - 12-30

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open xxx](C:/Users/..)
    - 1
    - 2-5
```

### MVPtext 任务分工文件格式
```markdown
# [模块名] 任务分工

## 任务概述
- **模块名称**: [模块名]
- **负责子agent**: [子agent名称/编号]
- **优先级**: 高/中/低

## 任务目标
[描述本模块需要实现的功能]

## 具体任务
### 任务 1: [任务名称]
- **描述**: [任务描述]
- **输入**: [输入说明]
- **输出**: [输出说明]
- **验收标准**: [标准]

## 接口约定
### 对外接口
- [接口说明]
### 依赖接口
- [需要其他模块提供的接口]
```
