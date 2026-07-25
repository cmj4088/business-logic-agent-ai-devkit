###### 

##### year_2026
#### month_7
### day_25

---

## [2026-07-25 22:30] 服务器部署独立 Agent + 创建设置配置说明文档
- **需求**: 将独立智能体系统部署到 121.199.31.157 服务器，记录所有配置避免下次重搞
- **提示词**: "把这些东西记录一下，别下一次我还要重新搞这么多配置。这个就记录在项目里边，然后重新安排个文件夹，叫做服务器配置"
- **改动文件**:
  - `服务器配置/服务器部署记录.md`（新建）
  - `backend/m0_infrastructure/main.py`（修改：添加 `_register_builtin_agents` 启动时注册）
  - `backend/m4_agent_orchestration/router.py`（修改：添加 registry 注册/列表/删除/健康检查端点）
- **改动说明**:
  - 在项目根目录新建 `服务器配置/` 文件夹，记录完整部署信息
  - 记录了服务器 IP、项目路径、所有服务端口、启动/停止命令、Agent URL 列表
  - 记录了登录/注册 token、注册远程 Agent、查看日志、防火墙端口等常见操作
  - 服务器后端通过 `PYTHONPATH=/root/bla/package/src` 解决 shared 模块导入问题
  - 6 个 Agent 注册信息持久化到 agent_registry 数据库表，重启后不丢失

---

## [2026-07-25 21:30] 新增独立智能体系统（Standalone Agent）
- **需求**: 创建可以独立部署、通过 URL 拉入项目的 IPD Agent 智能体系统
- **提示词**: "他要我搞一个智能体，就是一个独立的智能体，可以拉入到这个项目里边的。这里边会有一个智能体URL。现在你根据我原有的几个内置角色进行智能体生成"
- **改动文件**:
  - `backend/standalone_agent/__init__.py`（新建）
  - `backend/standalone_agent/manifest.py`（新建）
  - `backend/standalone_agent/server.py`（新建）
  - `backend/standalone_agent/registry.py`（新建）
  - `backend/standalone_agent/runner.py`（新建）
  - `backend/standalone_agent/start_all_agents.sh`（新建）
  - `backend/agents/product_manager.json`（新建）
  - `backend/agents/rd.json`（新建）
  - `backend/agents/qa.json`（新建）
  - `backend/agents/marketing.json`（新建）
  - `backend/agents/manufacturing.json`（新建）
  - `backend/agents/finance.json`（新建）
  - `backend/m0_infrastructure/main.py`（修改）
  - `backend/m0_infrastructure/migrations/v008_agent_registry.sql`（新建）
  - `backend/m4_agent_orchestration/orchestrator.py`（修改）
  - `backend/m4_agent_orchestration/router.py`（修改）
  - `docx/standalone-agent-design.md`（新建）
  - `basic_code_information_archive/backend/standalone_agent.md`（新建）
- **改动说明**:
  - 新建 standalone_agent 包：含 manifest（清单模型）、server（FastAPI 服务）、registry（注册发现）、runner（CLI 启动器）
  - 创建 6 个 Agent 清单 JSON 文件，对应 6 个内置 IPD 角色
  - 更新编排器：优先调用远程 Agent（如已注册），失败后降级到本地 LLM
  - 更新路由：新增 Agent 注册/发现 API 端点（POST/GET/DELETE /api/agents/registry）
  - 更新启动逻辑：启动时自动加载 agents/*.json 注册内置 Agent
  - 数据库迁移 v008：agent_registry 表持久化远程 Agent 注册信息

---

##### year_2026
#### month_7
### day_25

---

## [2026-07-25 13:00] 修复 Electron 客户端闪退问题（"没法显示"）
- **需求**: 安装 BLA 客户端后点击快捷方式无反应/闪退，重新安装提示"关闭不了"
- **提示词**: 现在是这个情况，我下载这个东西的期间会有卡顿，然后呢，下载完以后点击快捷方式会发现没有任何弹窗，弹出来就相当于是闪退或者是这个脚本根本没有启动
- **改动文件**:
  - `electron/main.ts`
  - `electron/package.json`
  - `frontend/src/shared/api-client.ts`
- **改动说明**:
  - 根因：服务器 `http://121.199.31.157:8000` 没有部署前端静态文件，`_mount_frontend_static()` 静默跳过
  - 直接原因：Electron 客户端模式用 `loadURL(SERVER_URL)` 加载地址 → 得到 JSON 404 → 窗口空白/闪退
  - 修复 1：客户端模式改为加载本地打包的前端文件（`loadFile(process.resourcesPath + /frontend/dist/index.html)`）
  - 修复 2：CSP 策略修复——原代码 push 了第二个 `connect-src` 导致策略无效，改为合并到一个 directive
  - 修复 3：前端 API 客户端动态获取 Electron 提供的服务器 URL（通过 `window.electronAPI.getServerUrl()` 异步获取）
  - 修复 4：`electron/package.json` 新增 extraResources 条目将 `frontend/dist` 打包进安装包

---

## 对应主函数/前端/后端位置
- [Click here to open electron/main.ts](C:/Users/32277/Desktop/Business logic agents/electron/main.ts)
  - 156-210（loadFrontend — 改为加载本地文件）
  - 268-300（setupCSP — 合并 connect-src）
- [Click here to open electron/package.json](C:/Users/32277/Desktop/Business logic agents/electron/package.json)
  - 26-31（extraResources — 新增 frontend/dist）
- [Click here to open frontend/src/shared/api-client.ts](C:/Users/32277/Desktop/Business logic agents/frontend/src/shared/api-client.ts)
  - 16-36（getElectronServerUrl — 动态获取服务器地址）
  - 49-61（请求拦截器 — 异步解析服务器 URL）

## 对应 basic_code_information_archive 位置
- [Click here to open basic_code_information_archive/electron/](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/electron/)
  - 已更新

---

## [2026-07-25 13:16] 修复 HTML 硬编码 CSP 导致 API 请求被拦截
- **需求**: 应用启动后 API 请求全被 CSP 拦截
- **改动文件**: `frontend/index.html`
- **改动说明**: 
  - 根因：`frontend/index.html` 第 6 行有 `<meta http-equiv="Content-Security-Policy">` 硬编码了 `connect-src 'self' http://localhost:* ws://localhost:*`，没有包含云服务器地址
  - 根据 CSP 规范，HTTP 头 + meta 标签两个策略的**交集**生效 → Electron 头允许了服务器地址，但 meta 标签没允许 → API 被拦截
  - 修复：移除该 `<meta>` 标签，由 Electron 的 `setupCSP()` 统一管理安全策略
  - 浏览器 dev 模式由 Vite 处理，不受影响

---

## 对应主函数/前端位置
- [Click here to open frontend/index.html](C:/Users/32277/Desktop/Business logic agents/frontend/index.html)
  - 第 6 行（原 CSP meta 标签已删除）

---

### day_24

---

## [2026-07-24] 创建 Electron EXE 安装包构建方案（build-exe.bat + 客户端模式）
- **需求**: 制作一个安装包 EXE，评委下载安装后桌面出现图标，点开就连到用户电脑的 BLA 服务器
- **提示词**: "可能我的描述有点问题，我需要的是一个安装包EXE安装包就是，别人可以直接点我的这个安装包下载这个前端，然后和后端就能连接，然后进行连作工作。"
- **改动文件**:
  - build-exe.bat（新建 — 一键构建 EXE 安装包脚本）
  - electron/main.ts（重构 — 新增客户端模式，支持 --server 配置和远程服务器连接）
  - electron/preload.ts（新增 — getServerUrl IPC 桥接）
  - electron/ipc-handlers.ts（新增 — server:get-url IPC 处理器 + setServerUrl 导出）
  - electron/package.json（重构 — 添加 electron-builder + NSIS 打包配置，重命名为 bla-judge-client）
- **改动说明**:
  1. build-exe.bat：接收服务器 IP 参数，自动构建前端 + 生成 app-config.json + 编译 Electron TS + 打包为 NSIS 安装程序，输出到 electron/dist-electron/
  2. main.ts：新增 loadAppConfig() 读取 app-config.json；新增 IS_CLIENT_MODE/SERVER_URL 判断；客户端模式下不启动 PythonBridge，直接加载远程服务器 URL；CSP 动态添加远程服务器域名
  3. preload.ts：暴露 getServerUrl() 方法，渲染进程可通过 window.electronAPI.getServerUrl() 获取服务器地址
  4. ipc-handlers.ts：新增 server:get-url 通道，setServerUrl() 导出供 main.ts 调用
  5. package.json：添加 electron-builder ^24.0.0 依赖，NSIS 安装程序配置（桌面快捷方式、自定义安装目录等）
- **架构变更**: Electron 新增"客户端模式"，作为纯浏览器壳连接远程 BLA 服务器。评委电脑无需安装 Python/Node，安装包约 60MB

---

## 对应主函数/脚本的位置
- [Click here to open build-exe.bat](C:/Users/32277/Desktop/Business logic agents/build-exe.bat)
    - 全部（一键构建脚本）
- [Click here to open main.ts (electron)](C:/Users/32277/Desktop/Business logic agents/electron/main.ts)
    - 15-45（AppConfig 接口、loadAppConfig 函数、客户端模式上下文）
    - 112-122（客户端模式启动逻辑）
    - 211-222（CSP 动态添加远程服务器域名）
    - 252-262（loadFrontend 客户端模式分支）

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open main.md (electron)](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/electron/main.md)
    - 8-13（新增客户端模式说明）
    - 32-38（运行模式对比表）
- [Click here to open preload.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/electron/preload.md)
    - 38-42（getServerUrl API 说明）
- [Click here to open ipc-handlers.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/electron/ipc-handlers.md)
    - 58-63（server:get-url 通道说明）

---

### day_24

---

## [2026-07-24] 创建局域网服务器一键启动方案（BLA_Server.bat + 快捷方式 + 后端自托管前端）
- **需求**: 将项目配置为 Windows 服务器，其他电脑可通过局域网浏览器访问并使用 BLA 应用
- **提示词**: "现在你将我这个项目以我这个电脑为主机进行一个后端的构建，然后我可以使用其他电脑进行连接并使用我那个程序。然后我希望这个东西有一个的启动的脚本，就是我在桌面上有一个快捷按钮，打开以后整个后端就启动，然后前端就能连接到我这个电脑"
- **改动文件**:
  - BLA_Server.bat（新建 — 一键启动服务器脚本）
  - 创建快捷方式.bat（新建 — 桌面快捷方式创建工具）
  - backend/m0_infrastructure/main.py（新增静态文件挂载 + SPA 回退路由）
  - frontend/vite.config.ts（新增 server.host: true 支持局域网访问）
  - frontend/src/shared/constants.ts（API_BASE_URL 默认值改为空字符串）
  - basic_code_information_archive/（同步更新 3 个说明文档）
- **改动说明**:
  1. BLA_Server.bat：一键启动服务器模式，自动检测依赖、安装必要包、构建前端（VITE_API_BASE_URL=/api）、启动后端（0.0.0.0:8000）、显示局域网 IP 连接地址
  2. 创建快捷方式.bat：在桌面创建"BLA 服务器.lnk"快捷方式，双击即可启动
  3. backend/main.py：新增 `_mount_frontend_static()` 函数，检测 `frontend/dist` 目录并挂载为 SPA 静态文件服务，支持单端口同时提供 API + 前端页面
  4. frontend/constants.ts：`API_BASE_URL` 默认从 `http://localhost:8000` 改为空字符串（同源请求），可通过 `.env` 覆盖
  5. frontend/vite.config.ts：`server.host: true` 使 Vite 开发服务器监听所有网络接口
- **架构变更**: 新增"生产模式自托管"部署方式 — 后端单进程同时提供 API 和前端静态文件，其他电脑只需访问 `http://服务器IP:8000` 即可使用完整应用，无需额外配置

---

## 对应主函数/脚本的位置
- [Click here to open BLA_Server.bat](C:/Users/32277/Desktop/Business logic agents/BLA_Server.bat)
    - 全部（一键启动脚本）
- [Click here to open 创建快捷方式.bat](C:/Users/32277/Desktop/Business logic agents/创建快捷方式.bat)
    - 全部（快捷方式创建工具）

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open main.md (backend)](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/backend/m0_infrastructure/main.md)
    - 6-10（新增 SPAStaticFiles 和 _mount_frontend_static 说明）
- [Click here to open constants.md (frontend)](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/frontend/src/shared/constants.md)
    - 30-32（API_BASE_URL 默认值改为空字符串，新增服务器模式说明）
- [Click here to open vite.config.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/frontend/vite.config.md)
    - 20-21（新增 server.host 配置说明）
    - 43-44（新增 host: true 和生产模式说明）

---

### day_23

---

## [2026-07-23] 创建 U盘离线部署脚本（prepare_usb.bat + deploy.sh）
- **需求**: 制作一个脚本放在U盘，在 Linux 直接下载该项目后端，本地安装，不用连接 GitHub，用 Docker，清空U盘其他内容，给出后端端口
- **提示词**: "你现在给我做一个脚本在U盘，用来在linux直接下载该项目的后端，本地安装，不用连接GitHub，后面端口，用docker，U盘清空除了这个脚本和项目源文件的其他内容"
- **改动文件**:
  - prepare_usb.bat（新建 — Windows U盘准备脚本）
  - deploy.sh（新建 — Linux Docker 部署脚本）
- **改动说明**:
  - prepare_usb.bat: 清空U盘 → 复制 backend/、shared/、docker/Dockerfile.backend、docker-compose.yml、.dockerignore、deploy.sh 到U盘根目录
  - deploy.sh: 自动检测/安装 Docker → 从U盘本地源码构建镜像（不依赖 GitHub）→ 启动后端容器 → 暴露 8000 端口（可通过参数自定义）→ API 连通性测试

---

### day_18

---

## [2026-07-18] 全局改名：IPD Agent Studio → Business Logic Agent
- **需求**: 将项目名从 IPD Agent Studio 改为 Business Logic Agent，IPD 降级为内置模板
- **提示词**: "Business Logic Agent" + "可以"
- **改动文件**:
  - shared/config.py（app_name 默认值）
  - backend/config.yaml（app_name 覆盖值）
  - shared/constants.py, shared/types.py, shared/api-client.ts（文件描述）
  - shared/constants.ts, shared/types.ts（文件描述）
  - frontend/index.html（标题）
  - frontend/src/shared/api-client.ts, constants.ts, types.ts（文件描述）
  - frontend/src/shared/components/TermsOfServiceModal.tsx, PrivacyPolicyModal.tsx（用户协议）
  - frontend/src/m11_auth_pages/components/LoginPage.tsx, RegisterPage.tsx（登录/注册页标题）
  - frontend/src/m11_auth_pages/__tests__/components/LoginPage.test.tsx（测试断言）
  - frontend/src/m18_usage_settings/components/AboutPage.tsx（关于页面）
  - frontend/src/m19_plugin_management/index.tsx（插件管理描述）
  - backend/skills/docx_skill.py（文档生成默认作者）
  - demo/start_all.bat, start_backend.bat, start_frontend.bat（控制台标题）
  - demo/README.md
  - skill/README.md
  - MVPtext/CLAUDE.md, MVPtext/frontend/m18-usage-settings/CLAUDE.md
  - docx/project_design.md, requirements_spec.md, mvp-guide-v2.md, ipd-workflow-template.md, plugin-manifest-schema.md
  - CLAUDE.md（项目定位重写）
  - basic_code_information_archive/ 6 个文件描述同步更新
- **改动说明**: 将所有用户可见和开发者文档中的 "IPD Agent Studio" 替换为 "Business Logic Agent"，更新项目定位描述将 IPD 降级为内置模板。共修改约 30 个文件。
- **注意**: frontend/dist/ 构建产物未改，下次构建覆盖即可。

---

## [2026-07-15 15:45] 创建 Trae 规则：将全局规则转换为 .trae/rules/ 格式
- **需求**: 将全局规则以 Trae 的规则格式加载到项目目录里，删除原有的 Trae 规则
- **提示词**: "将全局规则以trae的规则格式给加载到项目目录里，删除原有的trae的规则"
- **改动文件**: 
  - .trae/rules/general-rule.md（新建）
  - .trae/rules/python-rule.md（新建）
  - .trae/rules/typescript-react-rule.md（新建）
  - .trae/rules/project-structure-rule.md（新建）
- **改动说明**: 将全局规则（语言偏好/行为准则/环境/代码规范/目录结构/文档格式）转换为 Trae IDE 的 .trae/rules/ markdown 格式，按作用域分为 4 个规则文件。原有 Trae 规则不存在，无需删除。

---

## 对应主函数的位置，包括链接和行数
- [Click here to open .trae/rules/](C:/Users/32277/Desktop/IPDagents/.trae/rules/)
    - general-rule.md（1-32 行：语言偏好/行为准则/环境）
    - python-rule.md（1-64 行：Python 后端开发规范）
    - typescript-react-rule.md（1-51 行：TypeScript/React 前端规范）
    - project-structure-rule.md（1-110 行：目录结构/文档格式）

## 对应在 basic_code_information_archive 的文档位置
- .trae/rules/ 为 IDE 配置目录，暂不入 basic_code_information_archive（非代码文件）

---

## [2026-07-15 16:00] 项目整理：全局规则合规化整理（demo/MVPtext/档案/memory/日志）
- **需求**: 按全局规则（CLAUDE.md + personal-rules.md）对项目进行全面整理，确保各目录结构和文件格式合规
- **提示词**: "现在你整理一下整个项目要符合你的全局规则"
- **改动文件**: 
  - demo/ 结构重组 + 6 个子目录 README.md + 根 README.md 更新
  - modification_log/sublog/ 3 个文件 "yrar" → "year" 拼写修正
  - modification_log/modification_log.md 总览统计更新（新增 demo/archive/memory/memory-index 统计行）
  - basic_code_information_archive/FORMAT_GUIDE.md（新建）+ m0_infrastructure/main.md / m1_auth_security/router.md / electron/main.md 格式统一为模板标准
  - MVPtext/FORMAT_GUIDE.md（新建）
  - .claude/projects/*/memory/ 3 个记忆文件 + MEMORY.md 索引（新建）
  - 根目录 personal-rules.md 保留（内容已由系统提示覆盖，待后续确认是否移入 memory）
- **改动说明**:
  1. demo/ 将 6 个平铺脚本（check_api/verify_api/check_project/advance_project/seed_data/test_plugins）各自移入独立子目录并创建独立 README.md，符合"每个测试独立目录+README"要求
  2. sublog 修复 backend/frontend/MVPtext 三文件中的 "yrar_2026" → "year_2026" 拼写错误
  3. basic_code_information_archive 新增 FORMAT_GUIDE.md 说明模板格式，更新 3 个代表性文件为模板格式（含路径/作用/关键函数/依赖关系/最后修改/修改原因 6 项元数据）
  4. MVPtext 新增 FORMAT_GUIDE.md 说明任务分工文件的标准模板格式，后续逐步对齐
  5. memory/ 建立 3 个初始记忆文件（项目概述/结构规则/开发流程）和 MEMORY.md 索引
  6. modification_log.md 总览新增 demo/archive/memory/memory-index 四个分类统计行

---

## 对应主函数的位置，包括链接和行数
- [Click here to open demo/README.md](C:/Users/32277/Desktop/IPDagents/demo/README.md)
    - 1-末尾（更新：新增子目录结构表和各测试运行命令）
- [Click here to open demo/check-api/README.md](C:/Users/32277/Desktop/IPDagents/demo/check-api/README.md)
    - 1-末尾（新建：测试目的/运行方式/预期结果）
- [Click here to open demo/verify-api/README.md](C:/Users/32277/Desktop/IPDagents/demo/verify-api/README.md)
    - 1-末尾（新建，同上格式）
- [Click here to open demo/check-project/README.md](C:/Users/32277/Desktop/IPDagents/demo/check-project/README.md)
    - 1-末尾（新建）
- [Click here to open demo/advance-project/README.md](C:/Users/32277/Desktop/IPDagents/demo/advance-project/README.md)
    - 1-末尾（新建）
- [Click here to open demo/seed-data/README.md](C:/Users/32277/Desktop/IPDagents/demo/seed-data/README.md)
    - 1-末尾（新建）
- [Click here to open demo/test-plugins/README.md](C:/Users/32277/Desktop/IPDagents/demo/test-plugins/README.md)
    - 1-末尾（新建）
- [Click here to open modification_log/modification_log.md](C:/Users/32277/Desktop/IPDagents/modification_log/modification_log.md)
    - 全部（更新：新增 demo/archive/memory/memory-index 四行统计）
- [Click here to open basic_code_information_archive/FORMAT_GUIDE.md](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/FORMAT_GUIDE.md)
    - 1-末尾（新建：档案模板格式规范）
- [Click here to open basic_code_information_archive/backend/m0_infrastructure/main.md](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/backend/m0_infrastructure/main.md)
    - 全部（重写为模板格式：6 个文件条目，每个含路径/作用/关键函数/依赖关系/最后修改/修改原因）
- [Click here to open basic_code_information_archive/backend/m1_auth_security/router.md](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/backend/m1_auth_security/router.md)
    - 全部（重写为模板格式：5 个文件条目）
- [Click here to open basic_code_information_archive/electron/main.md](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/electron/main.md)
    - 全部（重写为模板格式：保留详细函数说明 + 新增元数据字段）
- [Click here to open MVPtext/FORMAT_GUIDE.md](C:/Users/32277/Desktop/IPDagents/MVPtext/FORMAT_GUIDE.md)
    - 1-末尾（新建：MVPtext 模板格式规范）
- [Click here to open memory/MEMORY.md](C:/Users/32277/Desktop/IPDagents/../../.claude/projects/c--Users-32277-Desktop-IPDagents/memory/MEMORY.md)
    - 1-3（新建：3 条记忆索引）
- [Click here to open memory/ipd-agent-studio-overview.md](同上目录)
    - 1-末尾（新建：项目概述记忆）
- [Click here to open memory/project-structure-rules.md](同上目录)
    - 1-末尾（新建：结构规则记忆）
- [Click here to open memory/development-workflow-rules.md](同上目录)
    - 1-末尾（新建：开发流程记忆）
- sublog 拼写修正：backend_modification_log.md / frontend_modification_log.md / MVPtext_modification_log.md 三文件的 "yrar" → "year"

## 对应在 basic_code_information_archive 的文档位置
- FORMAT_GUIDE.md 为档案自身的格式规范，位于档案根目录
- 更新后的 3 个文件（m0_infrastructure/main.md / m1_auth_security/router.md / electron/main.md）在档案中的各自位置
- memory/ 文件位于 Claude 全局记忆目录，不在项目 basic_code_information_archive 范围内

---

### day_10

---

## [2026-07-10 01:30] 项目整理：skill SKILL.md + demo README + 清理缓存
- **需求**: 按 personal-rules.md 规则对项目结构进行整理
- **提示词**: "现在根据这两个规则文件进行项目的整理" → 选择"2.修复 skill/ SKILL.md + 3.补 demo/ README + 4.清理根目录缓存"
- **改动文件**: skill/*/SKILL.md（8个，由 README.md 重命名）、demo/README.md（新建）、根目录 .pytest_cache/（删除）
- **改动说明**:
  1. skill/ 8 个子目录（backend-architect/bug-fix/code-review/commit-commands/feature-dev/pr-review-toolkit/senior-frontend/test-writer-fixer）的 README.md 重命名为 SKILL.md，内容不变（原本就是 skill 说明文档）
  2. demo/ 新增 README.md，说明 3 个 .bat（start_all/start_backend/start_frontend）的测试目的/运行方式/预期结果/故障排查/注意事项
  3. 删除根目录 .pytest_cache/（应只在 backend/ 下，根目录的属于越界缓存）

---

## 对应主函数的位置，包括链接和行数
- [Click here to open demo/README.md](C:/Users/32277/Desktop/IPDagents/demo/README.md)
    - 1-末尾（新建：测试目的/环境前置/文件清单/运行方式/预期结果/故障排查/注意事项）
- [Click here to open skill/backend-architect/SKILL.md](C:/Users/32277/Desktop/IPDagents/skill/backend-architect/SKILL.md)
    - 原为 README.md，重命名为 SKILL.md，内容为后端架构 skill 说明（概述/功能/安装/调用方式/示例/适用场景）
- 其余 7 个 skill 子目录同上：bug-fix/SKILL.md、code-review/SKILL.md、commit-commands/SKILL.md、feature-dev/SKILL.md、pr-review-toolkit/SKILL.md、senior-frontend/SKILL.md、test-writer-fixer/SKILL.md
- 根目录 .pytest_cache/ 已删除（无链接）

## 对应在 basic_code_information_archive 的文档位置
- skill/ 和 demo/ 不属于代码模块，basic_code_information_archive 暂不收录。如需补充可后续添加

---

## [2026-07-10 00:00] 复制全局个人规则到项目为独立文档
- **需求**: 用户要求将 Trae 全局规则 personal-rules.md 复制一份到本项目
- **提示词**: "你将这个全局规则复制一个到本项目" → 追问后选择"追加合并到 CLAUDE.md" → 中途改主意："能不能整合成一个新文档，这样命中率会变低" → 最终选择"项目根目录/personal-rules.md"
- **改动文件**: CLAUDE.md（先追加后撤回，恢复原 191 行）、personal-rules.md（新建）
- **改动说明**: 中途曾将全局规则追加合并到 CLAUDE.md 末尾（191→320 行），用户指出会降低规则命中率后撤回，CLAUDE.md 恢复至原始 191 行；改为创建独立文件 `personal-rules.md`（126 行），内容为 `C:\Users\32277\.trae\rules\personal-rules.md` 的完整副本，与项目 CLAUDE.md 并列存放，两份规则分别命中

---

## 对应主函数的位置，包括链接和行数
- [Click here to open personal-rules.md](C:/Users/32277/Desktop/IPDagents/personal-rules.md)
    - 1-126（整个文件新建：语言偏好/行为准则/环境/代码编写规则/各目录详细要求/三大模板格式）
- [Click here to open CLAUDE.md](C:/Users/32277/Desktop/IPDagents/CLAUDE.md)
    - 191（末行 `- `MVPtext/CLAUDE.md` — 子 Agent 任务分工规则`，已恢复原状，无新增）

## 对应在 basic_code_information_archive 的文档位置
- 本次改动为根目录元规则文件，basic_code_information_archive 暂无对应说明文件（personal-rules.md 与 CLAUDE.md 均不属于代码文件）。如需补充可后续添加 basic_code_information_archive/personal-rules.md 说明

---

##### year_2026
#### month_7
### day_9
    - 2026-7-9-19:15（第二十步 — 端到端验证与Bug修复）
    - 发现并修复 6 个前后端集成 Bug：
      1. Dashboard 500 错误：pending_items 和 notifications 表缺失（v005 迁移已记录但未实际创建）
      2. Dashboard 字段名不匹配：后端 snake_case vs 前端 camelCase（pending_items→pending_tasks, auto_completed→recent_auto_completed 等）
      3. Dashboard 用户信息不匹配：后端返回 {id, email, display_name} vs 前端需要 {name, avatar, role}
      4. 项目字段名不匹配：complexity_tier→complexity, current_stage→currentStage, created_at→createdAt 等
      5. 项目额外字段不匹配：target_weeks→targetWeeks, team_size→teamSize, budget_limit→budgetLimit
      6. 项目列表缺少分页字段：无 pageSize 和 totalPages
    - 创建迁移 v006_pending_notifications.sql（添加 pending_items 和 notifications 表）
    - 修复 m8_realtime_communication/router.py：Dashboard 响应格式改为 camelCase，匹配前端类型
    - 修复 m2_workflow_engine/engine.py：get_project/list_projects 返回 camelCase 字段名
    - 修复 engine.py 中所有引用 project["current_stage"] 的地方改为 project["currentStage"]
    - 验证：创建项目 200、Dashboard 200、项目列表 200、TypeScript 零错误
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open v006_pending_notifications.sql](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/migrations/v006_pending_notifications.sql)
        1-27（整个文件新建）
    - [Click here to open router.py (M8 Dashboard)](C:/Users/32277/Desktop/IPDagents/backend/m8_realtime_communication/router.py)
        316-418（Dashboard 响应格式改为 camelCase）
    - [Click here to open engine.py (M2)](C:/Users/32277/Desktop/IPDagents/backend/m2_workflow_engine/engine.py)
        263-276（get_project: 字段名改为 camelCase），303-317（list_projects: 字段名改为 camelCase），多个函数引用 currentStage 更新
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive
    - 2026-7-9-18:45（第十九步 — 修复登录失败问题）
    - 发现并修复 3 个 Bug：
      1. 请求拦截器未添加 Token：api-client.ts 注释写"后续添加"但从未实现，导致登录后 /api/auth/me 返回 401
      2. 响应拦截器不检查业务错误：后端返回 HTTP 200 + {error: {...}} 时前端不抛异常，导致登录失败静默
      3. ApiResponse 类型缺少 error 字段：与后端 {data, error, meta} 格式不匹配
      4. 缺少 config.yaml：jwt_secret 为空，PyJWT 抛出 InvalidKeyError: HMAC key must not be empty → 500
    - 创建 backend/config.yaml（JWT 密钥 + Fernet 加密密钥 + 完整配置）
    - 修复 shared/api-client.ts：响应拦截器检查业务错误 + 请求拦截器自动添加 Token
    - 修复 shared/types.ts：ApiResponse 增加 error/meta 字段
    - 修复 m11_auth_pages/api.ts：wrapRequest 错误消息提取路径修正
    - 修复 m11_auth_pages/types.ts：AuthApiResponse 不再继承 ApiResponse（避免类型冲突）
    - 更新 demo/start_backend.bat：增加 config.yaml 存在性检查
    - 验证：curl 测试登录/注册均返回 200 + JWT Token，TypeScript 零错误，224+170 测试通过
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open config.yaml](C:/Users/32277/Desktop/IPDagents/backend/config.yaml)
        1-51（整个文件新建）
    - [Click here to open api-client.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/api-client.ts)
        20-27（请求拦截器：添加 Token），32-40（响应拦截器：检查业务错误）
    - [Click here to open types.ts (shared)](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/types.ts)
        58-66（ApiResponse 增加 error/meta）
    - [Click here to open api.ts (M11)](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/api.ts)
        12-19（wrapRequest 修正错误消息提取）
    - [Click here to open types.ts (M11)](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/types.ts)
        42-47（AuthApiResponse 独立定义）
    - [Click here to open start_backend.bat](C:/Users/32277/Desktop/IPDagents/demo/start_backend.bat)
        16-21（新增 config.yaml 检查）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-17:30（第十八步 — M14a 核心组件测试 + Electron 编译验证）
    - 新增 3 个 M14a 组件测试文件（29 个测试用例）：
      - ProjectHeader.test.tsx：项目头部渲染（12 测试）— 名称、复杂度模式、状态、阶段、进度条
      - GateStatus.test.tsx：门禁状态栏（9 测试）— 空列表、四状态图标、多门禁
      - StageTimeline.test.tsx：阶段时间线（8 测试）— 6 阶段渲染、完成/当前/待处理状态、点击回调
    - Electron 主进程 TypeScript 编译验证通过（tsc 零错误）
    - 前端测试总计：29 个文件，224 个测试用例，全部通过
    - 验证：TypeScript 零错误，Vite 构建成功（189 模块，431KB）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open ProjectHeader.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/components/ProjectHeader.test.tsx)
        1-74（整个文件新建）
    - [Click here to open GateStatus.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/components/GateStatus.test.tsx)
        1-75（整个文件新建）
    - [Click here to open StageTimeline.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/components/StageTimeline.test.tsx)
        1-108（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-17:15（第十七步 — 更多前端组件测试扩充）
    - 新增 7 个前端组件测试文件（55 个测试用例）：
      - M13 项目创建：IndustrySelector.test.tsx（5 测试）、ComplianceHints.test.tsx（5 测试）、ComplexityPreview.test.tsx（9 测试）
      - M17 Agent 配置：ModelSelector.test.tsx（8 测试）、ApiKeyConfig.test.tsx（10 测试）
      - Shared 共享组件：DisclaimerBanner.test.tsx（8 测试）
      - 修复 3 个测试小问题（脱敏文本正则、role=textbox 对 password 输入不可用、fixed 定位 DOM 层级）
    - 前端测试总计：26 个文件，195 个测试用例，全部通过
    - 验证：TypeScript 零错误，Vite 构建成功（189 模块，431KB）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open IndustrySelector.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m13_project_creation/__tests__/components/IndustrySelector.test.tsx)
        1-36（整个文件新建）
    - [Click here to open ComplianceHints.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m13_project_creation/__tests__/components/ComplianceHints.test.tsx)
        1-39（整个文件新建）
    - [Click here to open ComplexityPreview.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m13_project_creation/__tests__/components/ComplexityPreview.test.tsx)
        1-59（整个文件新建）
    - [Click here to open ModelSelector.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/__tests__/components/ModelSelector.test.tsx)
        1-57（整个文件新建）
    - [Click here to open ApiKeyConfig.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/__tests__/components/ApiKeyConfig.test.tsx)
        1-131（整个文件新建）
    - [Click here to open DisclaimerBanner.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/__tests__/components/DisclaimerBanner.test.tsx)
        1-61（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-17:00（第十六步 — 前端组件测试扩充）
    - 新增 10 个前端组件测试文件（96 个测试用例）：
      - M11 认证模块：LoginPage.test.tsx（9 测试）、ProtectedRoute.test.tsx（4 测试）
      - M12 Dashboard：WelcomeBanner.test.tsx（8 测试）、AutoCompletedTasks.test.tsx（10 测试）、PendingTasks.test.tsx（12 测试）、QuickActions.test.tsx（5 测试）
      - M15 审核模块：AutoApprovedBadge.test.tsx（4 测试）、VotePanel.test.tsx（19 测试）
      - M16 产出物编辑器：AIBadge.test.tsx（12 测试）
      - M18 设置模块：GeneralSettings.test.tsx（13 测试）
    - 前端测试总计：20 个文件，150 个测试用例，全部通过
    - 验证：TypeScript 零错误，Vite 构建成功（189 模块，431KB）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open LoginPage.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/__tests__/components/LoginPage.test.tsx)
        1-121（整个文件新建）
    - [Click here to open ProtectedRoute.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/__tests__/components/ProtectedRoute.test.tsx)
        1-65（整个文件新建）
    - [Click here to open WelcomeBanner.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m12_dashboard/__tests__/components/WelcomeBanner.test.tsx)
        1-91（整个文件新建）
    - [Click here to open AutoCompletedTasks.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m12_dashboard/__tests__/components/AutoCompletedTasks.test.tsx)
        1-95（整个文件新建）
    - [Click here to open PendingTasks.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m12_dashboard/__tests__/components/PendingTasks.test.tsx)
        1-113（整个文件新建）
    - [Click here to open QuickActions.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m12_dashboard/__tests__/components/QuickActions.test.tsx)
        1-57（整个文件新建）
    - [Click here to open AutoApprovedBadge.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m15_review_dashboard/__tests__/components/AutoApprovedBadge.test.tsx)
        1-28（整个文件新建）
    - [Click here to open VotePanel.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m15_review_dashboard/__tests__/components/VotePanel.test.tsx)
        1-235（整个文件新建）
    - [Click here to open AIBadge.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m16_artifact_editor/__tests__/components/AIBadge.test.tsx)
        1-99（整个文件新建）
    - [Click here to open GeneralSettings.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m18_usage_settings/__tests__/components/GeneralSettings.test.tsx)
        1-191（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-18:30（第十五步 — 合规交付物补全）
    - 新增 3 个合规组件：
      - PrivacyPolicyModal.tsx：隐私政策弹窗（PIPL 合规，需滚动阅读后同意）
      - TermsOfServiceModal.tsx：用户协议弹窗（AI 内容声明 + 免责声明）
      - DisclaimerBanner.tsx：AI 免责声明横幅（固定底部，可关闭）
    - 更新 RegisterPage：注册时必须勾选同意隐私政策和用户协议
    - 更新 App.tsx：全局添加 DisclaimerBanner 免责声明横幅
    - 验证：TypeScript 零错误，Vite 构建成功（188 模块，431KB），224 测试通过
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open PrivacyPolicyModal.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/components/PrivacyPolicyModal.tsx)
        1-131（整个文件新建）
    - [Click here to open TermsOfServiceModal.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/components/TermsOfServiceModal.tsx)
        1-138（整个文件新建）
    - [Click here to open DisclaimerBanner.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/components/DisclaimerBanner.tsx)
        1-52（整个文件新建）
    - [Click here to open RegisterPage.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/components/RegisterPage.tsx)
        3-4（新增导入），46-48（新增 state），68-71（新增验证），142-178（新增同意勾选框），228-243（新增弹窗）
    - [Click here to open App.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/App.tsx)
        12（新增导入），16-35（新增布局 + DisclaimerBanner）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive
    - 2026-7-9-18:15（第十四步 — 修复启动脚本 + 创建 requirements.txt）
    - 修复 demo/ 下三个 .bat 启动脚本的中文编码乱码问题（改为纯 ASCII）
    - start_backend.bat 新增 PYTHONPATH 环境变量设置
    - 创建 backend/requirements.txt（13 个依赖）
    - 验证：后端服务可正常启动（uvicorn on 0.0.0.0:8000）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open start_backend.bat](C:/Users/32277/Desktop/IPDagents/demo/start_backend.bat)
        1-14（重写，纯 ASCII + PYTHONPATH）
    - [Click here to open start_frontend.bat](C:/Users/32277/Desktop/IPDagents/demo/start_frontend.bat)
        1-11（重写，纯 ASCII）
    - [Click here to open start_all.bat](C:/Users/32277/Desktop/IPDagents/demo/start_all.bat)
        1-18（重写，纯 ASCII）
    - [Click here to open requirements.txt](C:/Users/32277/Desktop/IPDagents/backend/requirements.txt)
        1-13（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 已有档案覆盖
    - 2026-7-9-18:00（第十三步 — MVP 冒烟测试 + 基础设施修复）
    - 创建冒烟测试文件 test_smoke.py（10 个用例，覆盖 SM-02/03/10/11/18/19/20/28/29/30）
    - 修复 Dashboard 端点认证方式：支持 Authorization Header + query param 双模式
    - 修复 Dashboard SQL 查询中 projects 表列名错误（stage → current_stage）
    - 修复 Dashboard 中 created_at 字段 isoformat 类型错误（4 处）
    - 扩展 v005 迁移：新增 pending_items 和 notifications 表
    - 修复 M16 api-client 动态导入警告（改为静态导入）
    - 验证：后端 170 测试通过（99+61+10），TypeScript 零错误，Vite 构建零警告
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open test_smoke.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/tests/test_smoke.py)
        1-250（整个文件新建，10 个冒烟测试）
    - [Click here to open router.py (M8)](C:/Users/32277/Desktop/IPDagents/backend/m8_realtime_communication/router.py)
        1（Header 导入），72（isoformat 修复），274-310（Dashboard 双认证模式），315-333（projects 列名修复），354-397（isoformat 修复）
    - [Click here to open v005 migration](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/migrations/v005_user_onboarding.sql)
        1-33（扩展：新增 pending_items、notifications 表）
    - [Click here to open api.ts (M16)](C:/Users/32277/Desktop/IPDagents/frontend/src/m16_artifact_editor/api.ts)
        3（静态导入 apiClient），70-86（移除动态 import）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive
    - 2026-7-9-17:30（第十二步 — 前后端 API 契约对齐与集成测试）
    - 分析前后端 API 端点差异：发现 20+ 缺失端点、5 个 URL 不匹配
    - 后端新增端点：
      - M2 工作流引擎：get_current_stage_detail、get_activities、get_gates、pause_project、resume_project、submit_gate_vote 共 6 个方法
      - M2 路由：新增 6 个端点（/stage、/activities、/gates、/pause、/resume、/gates/{id}/vote）
      - M4 路由：新增 /api/agents/test（前端别名）、/api/agents/api-keys/status
      - M5 路由：新增附件上传/删除端点
      - M6 路由：新增 /api/reviews/history
      - M9 路由：新增 /api/usage/overview、/api/usage/projects、/api/usage/daily-trends、/api/usage/budget-alerts
      - M10 路由：新增 /api/recovery/projects/{id}/status（前端别名）
      - M0 基础设施：新建 settings_router.py（设置/数据/引导 5 个端点）
      - 新建 v005_user_onboarding.sql 迁移
    - 创建集成测试文件 test_integration_api.py（61 个测试用例，覆盖全部 10 个模块）
    - 修复 3 个 bug：gate_results 缺少 stage 字段、usage_records 列名错误、api_keys 查询错误表
    - 验证：后端 160 测试通过（99+61），TypeScript 零错误，Vite 构建成功
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open test_integration_api.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/tests/test_integration_api.py)
        1-470（整个文件新建，61 测试用例）
    - [Click here to open engine.py](C:/Users/32277/Desktop/IPDagents/backend/m2_workflow_engine/engine.py)
        478-615（新增 6 个方法）
    - [Click here to open router.py (M2)](C:/Users/32277/Desktop/IPDagents/backend/m2_workflow_engine/router.py)
        1-6（新增 Body 导入），116-188（新增 6 个端点）
    - [Click here to open router.py (M4)](C:/Users/32277/Desktop/IPDagents/backend/m4_agent_orchestration/router.py)
        75-102（新增 /test 别名和 /api-keys/status）
    - [Click here to open router.py (M5)](C:/Users/32277/Desktop/IPDagents/backend/m5_artifact_management/router.py)
        161-191（新增附件端点）
    - [Click here to open router.py (M6)](C:/Users/32277/Desktop/IPDagents/backend/m6_review_system/router.py)
        47-67（新增 /history 端点）
    - [Click here to open router.py (M9)](C:/Users/32277/Desktop/IPDagents/backend/m9_usage_tracking/router.py)
        1（Body 导入），78-175（新增 4 个前端兼容端点）
    - [Click here to open router.py (M10)](C:/Users/32277/Desktop/IPDagents/backend/m10_recovery/router.py)
        33-44（新增前端兼容别名）
    - [Click here to open settings_router.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/settings_router.py)
        1-195（整个文件新建）
    - [Click here to open main.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/main.py)
        111-113（注册 settings_router）
    - [Click here to open v005 migration](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/migrations/v005_user_onboarding.sql)
        1-9（整个文件新建）
    - [Click here to open CLAUDE.md](C:/Users/32277/Desktop/IPDagents/CLAUDE.md)
        171-174（更新项目状态）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive
    - 2026-7-9-16:45（第十一步 — 前后端类型一致性验证）
    - 验证前后端共享类型完全一致：IPDStage（6 阶段）、AgentRole（6 角色）、OrchestrationMode（3 模式）、ComplexityTier（4 级别）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open frontend shared/types.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/types.ts)
        1-77（全部一致）
    - [Click here to open shared/types.py](C:/Users/32277/Desktop/IPDagents/shared/types.py)
        1-45（全部一致）
## 对应在basic_code_information_archive的文档位置：
    - 已有档案覆盖

    - 2026-7-9-16:30（第十步 — 全部前端模块测试覆盖）
    - 新增 3 个前端测试文件（14 个测试用例）：
      - m16_artifact_editor/__tests__/types.test.ts: 产出物编辑器类型验证（5 个测试）
      - m17_agent_config/__tests__/types.test.ts: Agent 配置类型验证（4 个测试）
      - m18_usage_settings/__tests__/types.test.ts: 用量设置类型验证（5 个测试）
    - 前端测试总计：10 个文件，54 个测试用例，覆盖全部 8 个前端模块（M11-M18）
    - 验证：TypeScript 零错误，Vite 构建成功，后端 99 测试通过
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open m16 types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m16_artifact_editor/__tests__/types.test.ts)
        1-62（整个文件新建）
    - [Click here to open m17 types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/__tests__/types.test.ts)
        1-55（整个文件新建）
    - [Click here to open m18 types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m18_usage_settings/__tests__/types.test.ts)
        1-66（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-16:00（第九步 — v004 档案 + 最终验证）
    - 新增 v004_schema_v3_completion.md 档案文件
    - 最终验证：后端 99 测试通过，前端 40 测试通过，TypeScript 零错误，Vite 构建成功（187 模块，423KB）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open v004 archive](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/backend/m0_infrastructure/migrations/v004_schema_v3_completion.md)
        1-58（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 本次更新即为 basic_code_information_archive 自身内容

    - 2026-7-9-15:30（第八步 — 更多前端测试）
    - 新增 2 个前端测试文件（11 个测试用例）：
      - m13_project_creation/__tests__/types.test.ts: 项目创建类型验证（6 个测试）
      - m15_review_dashboard/__tests__/types.test.ts: 审核模块类型验证（5 个测试）
    - 前端测试总计：7 个文件，40 个测试用例，全部通过
    - 验证：TypeScript 零错误，后端 99 测试通过
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open m13 types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m13_project_creation/__tests__/types.test.ts)
        1-62（整个文件新建）
    - [Click here to open m15 types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m15_review_dashboard/__tests__/types.test.ts)
        1-62（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-15:00（第七步 — Electron 安全审查 + 更多前端测试）
    - Electron 安全审查通过：main.ts（CSP/CORS/沙箱/窗口安全）、preload.ts（contextBridge 最小暴露）、ipc-handlers.ts（输入校验/白名单）、python-bridge.ts（健康检查/崩溃恢复/优雅关闭）
    - 新增 2 个前端测试文件（8 个测试用例）：
      - m11_auth_pages/__tests__/types.test.ts: 认证模块类型验证（4 个测试）
      - m12_dashboard/__tests__/types.test.ts: Dashboard 类型验证（4 个测试）
    - 前端测试总计：5 个文件，29 个测试用例，全部通过
    - 验证：后端 99 测试通过，TypeScript 零错误，Vite 构建成功
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open main.ts](C:/Users/32277/Desktop/IPDagents/electron/main.ts)
        Electron 主进程安全审查通过
    - [Click here to open preload.ts](C:/Users/32277/Desktop/IPDagents/electron/preload.ts)
        Preload 安全审查通过
    - [Click here to open ipc-handlers.ts](C:/Users/32277/Desktop/IPDagents/electron/ipc-handlers.ts)
        IPC 安全审查通过
    - [Click here to open python-bridge.ts](C:/Users/32277/Desktop/IPDagents/electron/python-bridge.ts)
        Python 桥接审查通过
    - [Click here to open auth types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m11_auth_pages/__tests__/types.test.ts)
        1-52（整个文件新建）
    - [Click here to open dashboard types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m12_dashboard/__tests__/types.test.ts)
        1-54（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-14:30（第六步 — 前端路由补全 + 前端测试）
    - 路由补全：App.tsx 添加 M16 产出物编辑器路由（/artifacts, /artifacts/:artifactId），M18 设置页添加 Agent 配置路由（/settings/agent-config）
    - 创建 3 个前端测试文件（21 个测试用例）：
      - types.test.ts: 类型常量验证（6 个测试）
      - RecoveryPanel.test.tsx: 异常恢复面板渲染/交互（6 个测试）
      - GateVotingPanel.test.tsx: 门禁投票面板渲染/投票（9 个测试）
    - 验证：全部 21 测试通过，TypeScript 零错误，Vite 构建成功（187 模块，423KB）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open App.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/App.tsx)
        11-12（新增 M16 导入），22-23（新增 M16 路由）
    - [Click here to open m18 settings index.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m18_usage_settings/index.tsx)
        12（新增 AgentConfigPage 导入），109（新增导航链接），117（新增路由）
    - [Click here to open types.test.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/types.test.ts)
        1-47（整个文件新建）
    - [Click here to open RecoveryPanel.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/components/RecoveryPanel.test.tsx)
        1-101（整个文件新建）
    - [Click here to open GateVotingPanel.test.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/__tests__/components/GateVotingPanel.test.tsx)
        1-132（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-14:00（第五步 — 补全数据库迁移 v004）
    - 创建 v004_schema_v3_completion.sql 迁移，新增 3 张表：
      - agent_plugins: Agent 与插件的多对多关联表
      - audit_logs: 不可篡改审计日志链（SHA256 哈希链接）
      - gate_votes: 门禁投票明细表（替代 JSON 存储）
    - 至此 schema v3 全部 17 张表已通过迁移覆盖
    - 验证：后端 99 测试通过，TypeScript 零错误
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open v004_schema_v3_completion.sql](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/migrations/v004_schema_v3_completion.sql)
        1-47（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 下一步将更新 basic_code_information_archive

    - 2026-7-9-13:30（第四步 — 更新 basic_code_information_archive）
    - 新增 11 个档案文件：
      - backend/m0_infrastructure/migrations/v003_agent_messaging.md（数据库迁移 v003 说明）
      - hooks/useAgentChat.md, useActivityActions.md, useStageControl.md（M14b 3 个新 Hook 说明）
      - components/ActivityInteraction.md, HumanInputModal.md, StageAdvanceModal.md, StageRollbackModal.md, GateVotingPanel.md, RecoveryPanel.md, OnboardingGuide.md（M14b 7 个新组件说明）
    - 更新 5 个已有档案文件：index.md, AgentChat.md, ActivityList.md, types.md, api.md（添加 M14b 相关内容）
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open basic_code_information_archive](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive)
        新增 11 个文件，更新 5 个文件（详见上述列表）
## 对应在basic_code_information_archive的文档位置：
    - 本次更新即为 basic_code_information_archive 自身内容

    - 2026-7-9-13:00（第三步 — M14b 项目详情联调）
    - 在 M14a 目录中实现 M14b 全部交互联调功能：
      - 新增 3 个 hooks：useAgentChat（流式输出+推理摘要）、useActivityActions（活动操作）、useStageControl（阶段推进/回退）
      - 新增 7 个组件：ActivityInteraction、HumanInputModal（3 种 bypass）、StageAdvanceModal、StageRollbackModal、GateVotingPanel、RecoveryPanel（4 种异常）、OnboardingGuide（4 步引导）
      - 扩展 types.ts 添加消息/恢复/引导等类型
      - 扩展 api.ts 添加 15+ 个 API 函数
      - 重写 AgentChat.tsx 接入流式输出和推理摘要
      - 重写 ActivityList.tsx 接入活动交互
      - 重写 index.tsx 集成所有 M14b 组件（阶段控制/门禁投票/恢复/引导）
    - 验证：TypeScript 零错误，Vite 构建成功（159 模块，354KB），后端 99 测试通过
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open useAgentChat.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/hooks/useAgentChat.ts)
        1-159（整个文件新建）
    - [Click here to open useActivityActions.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/hooks/useActivityActions.ts)
        1-67（整个文件新建）
    - [Click here to open useStageControl.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/hooks/useStageControl.ts)
        1-94（整个文件新建）
    - [Click here to open ActivityInteraction.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/ActivityInteraction.tsx)
        1-114（整个文件新建）
    - [Click here to open HumanInputModal.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/HumanInputModal.tsx)
        1-152（整个文件新建）
    - [Click here to open StageAdvanceModal.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/StageAdvanceModal.tsx)
        1-97（整个文件新建）
    - [Click here to open StageRollbackModal.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/StageRollbackModal.tsx)
        1-110（整个文件新建）
    - [Click here to open GateVotingPanel.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/GateVotingPanel.tsx)
        1-112（整个文件新建）
    - [Click here to open RecoveryPanel.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/RecoveryPanel.tsx)
        1-101（整个文件新建）
    - [Click here to open OnboardingGuide.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/OnboardingGuide.tsx)
        1-124（整个文件新建）
    - [Click here to open AgentChat.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/AgentChat.tsx)
        1-217（重写，接入流式输出和推理摘要）
    - [Click here to open ActivityList.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/ActivityList.tsx)
        1-115（重写，接入活动交互）
    - [Click here to open index.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/index.tsx)
        1-286（重写，集成所有 M14b 组件）
    - [Click here to open types.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/types.ts)
        95-206（扩展 M14b 类型）
    - [Click here to open api.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/api.ts)
        37-148（扩展 M14b API 函数）
## 对应在basic_code_information_archive的文档位置：
    - 暂无（下一步将更新 basic_code_information_archive）

    - 2026-7-9-12:30（第二步 — 补全数据库迁移）
    - 创建 v003_agent_messaging.sql 迁移，新增 4 张表：
      - roles: 6 个 IPD Agent 角色定义（预设数据）
      - messages: Agent 对话消息（含 parent_id 支持多轮辩论）
      - agent_configs: 每个项目独立的 Agent 模型/参数配置
      - settings: 应用级设置（LLM后端/主题/预算告警等，含预设数据）
    - 验证：后端 99 测试通过，新迁移与现有代码兼容
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open v003_agent_messaging.sql](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/migrations/v003_agent_messaging.sql)
        1-73（整个文件新建）
## 对应在basic_code_information_archive的文档位置：
    - 暂无（下一步将更新 basic_code_information_archive）

    - 2026-7-9-12:00（项目继续开发 — 第一步）
    - 创建项目根目录 CLAUDE.md，包含项目概述、技术栈、目录结构、模块详解、开发规则、命令速查
    - 修复 TypeScript 编译错误（11 个）：
      - ReviewList.tsx: 移除未使用的 ReviewStatus 导入，修复 filter 类型断言
      - ApiKeyConfig.tsx: 移除未使用的 handleSave 函数
      - ModelParamsPanel.tsx: 移除未使用的 handleTempBlur 和 handleTokensBlur 函数
      - m17_agent_config/index.tsx: 移除未使用的 isTesting/testResult/testError/clearResult/handleOllamaTest
    - 修复 test_health.py 中的模块导入路径（m0-infrastructure → m0_infrastructure）
    - 验证：后端 99 测试通过，TypeScript 编译零错误，Vite 构建成功
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - [Click here to open CLAUDE.md](C:/Users/32277/Desktop/IPDagents/CLAUDE.md)
        1-180（整个文件新建）
    - [Click here to open test_health.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/tests/test_health.py)
        7（修复导入路径）
    - [Click here to open ReviewList.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m15_review_dashboard/components/ReviewList.tsx)
        3（移除未使用导入），102（修复类型断言）
    - [Click here to open ApiKeyConfig.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/components/ApiKeyConfig.tsx)
        65-74（移除未使用的 handleSave）
    - [Click here to open ModelParamsPanel.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/components/ModelParamsPanel.tsx)
        50-58（移除 handleTempBlur），70-77（移除 handleTokensBlur）
    - [Click here to open index.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/index.tsx)
        35（精简解构），61（参数加 _ 前缀），109-116（移除 handleOllamaTest）
## 对应在basic_code_information_archive的文档位置：
    - 暂无新增（下一步将更新 basic_code_information_archive）

    - 2026-7-9-00:30（项目初始化完成）
    - 按照 CLAUDE.md 规则整理项目结构，创建 modification_log 体系
    - 对应在basic_code_information_archive的文档位置
## 对应在主函数的位置，包括链接和行数：
    - 项目整体结构初始化，暂无具体代码改动
## 对应在basic_code_information_archive的文档位置：
    - 暂无