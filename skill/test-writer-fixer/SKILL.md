# test-writer-fixer — 测试自动化

## 概述
社区插件，自动编写和修复测试用例，支持多种测试框架。

## 支持框架
- **后端**: Pytest（Python）
- **前端**: Vitest、Jest（TypeScript/JavaScript）

## 安装
```
/plugin install test-writer-fixer
```

## 调用方式
```
/test-writer-fixer              # 自动分析并生成测试
/test-writer-fixer [文件路径]    # 为指定文件生成测试
/test-writer-fixer --fix        # 修复失败的测试
```

## 本项目使用示例
```
/test-writer-fixer backend/m5_artifact_management/artifact_service.py
/test-writer-fixer frontend/src/m12_dashboard/components/ProjectList.tsx
/test-writer-fixer --fix        # 修复所有失败的测试
```

## 测试要求
- 后端：每个 service 至少 80% 覆盖率
- 前端：每个组件至少覆盖 loading/error/empty 三态
- 测试文件放在 `tests/` 目录下

## 适用场景
- 新功能开发完成后编写测试
- 测试失败时自动修复
- 提升测试覆盖率