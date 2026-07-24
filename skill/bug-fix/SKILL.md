# bug-fix — Bug修复助手

## 概述
社区插件，通过堆栈跟踪分析自动定位和修复Bug。

## 功能
- 解析堆栈跟踪信息
- 自动定位错误源头
- 分析根本原因
- 生成修复方案
- 自动应用修复

## 安装
```
/plugin install bug-fix
```

## 调用方式
```
/bug-fix [错误信息或堆栈跟踪]
/bug-fix --auto    # 自动修复（无需确认）
```

## 本项目使用示例
```
/bug-fix "RuntimeError: 数据库未初始化 at backend/m0_infrastructure/database.py:45"
/bug-fix "TypeError: Cannot read property 'map' of undefined at ProjectList.tsx:52"
/bug-fix "jwt.exceptions.InvalidKeyError: HMAC key must not be empty"
```

## 修复流程
1. 分析堆栈跟踪 → 定位错误文件和行号
2. 读取相关代码上下文
3. 分析根本原因（逻辑错误/类型错误/配置问题/依赖问题）
4. 生成修复方案
5. 应用修复
6. 运行测试验证

## 适用场景
- 测试失败时
- 运行时错误
- 类型错误
- 配置问题