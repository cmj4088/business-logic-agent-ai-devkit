# API 基础连接检查

## 测试目的
检查后端 FastAPI 服务是否正常启动并响应，测试关键端点（登录、健康检查等）是否可用。

## 运行方式
```bash
# 确保后端已启动（http://localhost:8000）
python demo/check-api/check_api.py
```

## 预期结果
- 输出各 API 端点的响应状态码
- 成功时显示端点正常连接信息
- 失败时显示 HTTP 错误码及原因
