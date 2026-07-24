# 推进项目阶段

## 测试目的
模拟跳过项目中所有活动并推进到下一阶段，验证工作流引擎的阶段推进逻辑。

## 运行方式
```bash
# 确保后端已启动（http://localhost:8000）
# 需要项目包含指定的 activity_ids
python demo/advance-project/advance_project.py
```

## 预期结果
- 依次跳过项目中的每个活动（标记为完成）
- 所有活动跳过后推进到下一 IPD 阶段
- 控制台输出每个活动的处理结果
