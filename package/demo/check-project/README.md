# 项目状态检查

## 测试目的
检查指定 IPD 项目的当前状态，包括活动列表、阶段进度等。

## 运行方式
```bash
# 确保后端已启动（http://localhost:8000）
# 需要项目 proj_285ac0b183fd 已存在
python demo/check-project/check_project.py
```

## 预期结果
- 连接数据库并查询指定项目的活动
- 输出当前项目各活动的状态（待办/进行中/已完成）
- 显示当前阶段和下一阶段信息
