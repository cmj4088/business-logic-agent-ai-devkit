# API 端到端验证

## 测试目的
验证核心业务流程的 API 端到端是否正常：登录 → 获取审核列表 → 检查产出物等关键路径。

## 运行方式
```bash
# 确保后端已启动（http://localhost:8000）
# 需要测试用户 test2@test.com / Test123456 已注册
python demo/verify-api/verify_api.py
```

## 预期结果
- 登录成功并获取 Token
- 审核列表返回正常的审核数据
- 所有 API 调用返回 200 状态码
