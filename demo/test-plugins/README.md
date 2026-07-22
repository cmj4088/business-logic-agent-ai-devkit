# 插件系统测试

## 测试目的
验证插件系统 API 是否正常工作，包括插件列表查询、启用/禁用插件、插件配置等。

## 运行方式
```bash
# 确保后端已启动（http://localhost:8000）
# 需要管理员用户 admin@ipd.com / Admin123456! 已注册
python demo/test-plugins/test_plugins.py
```

## 预期结果
- 登录成功并获取管理员 Token
- 插件列表返回已注册的内置插件
- 插件启用/禁用操作返回正确状态码
