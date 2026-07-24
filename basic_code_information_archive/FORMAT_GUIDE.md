# basic_code_information_archive 格式规范

## 模板格式
所有说明文件需遵循以下模板：

```markdown
# [目录/模块名] 代码说明

## 文件: [文件名]
- **路径**: [从项目根目录起的完整路径]
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

## 说明
1. 每个主程序文件在此目录有一个对应的 `.md` 说明文件
2. 目录结构与主程序镜像一致（如 `backend/m0_infrastructure/` → `basic_code_information_archive/backend/m0_infrastructure/`）
3. 新增/删除代码文件时同步新增/删除说明文件
4. AI 改代码前必须先读此目录
