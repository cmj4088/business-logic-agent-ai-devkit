"""直接向数据库插入测试数据，让审核、产出物页面有内容可显示"""
import sqlite3
import uuid
from datetime import datetime, timezone

DB_PATH = r'C:\Users\32277\Desktop\IPDagents\backend\data\ipd_agent.db'

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

PROJECT_ID = 'proj_285ac0b183fd'
USER_ID = 'user_2bb2e5c433b7'

# 1. 创建审核任务 (review_tasks 表)
cur.execute("SELECT COUNT(*) FROM review_tasks WHERE project_id = ?", (PROJECT_ID,))
count = cur.fetchone()[0]
print(f"当前审核任务数量: {count}")

if count == 0:
    review_tasks = [
        ('rev_task_001', PROJECT_ID, 'gate_CDCP', None, 'pending', 0, 'product_manager', now, now),
        ('rev_task_002', PROJECT_ID, 'gate_CDCP', None, 'pending', 0, 'finance', now, now),
        ('rev_task_003', PROJECT_ID, 'gate_CDCP', None, 'pending', 0, 'marketing', now, now),
    ]
    cur.executemany("""
        INSERT INTO review_tasks (id, project_id, gate_id, artifact_id, status, auto_approved, assigned_to, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, review_tasks)
    print(f"已插入 {len(review_tasks)} 条审核任务")

# 2. 创建产出物 (artifacts 表)
cur.execute("SELECT COUNT(*) FROM artifacts WHERE project_id = ?", (PROJECT_ID,))
count = cur.fetchone()[0]
print(f"当前产出物数量: {count}")

if count == 0:
    artifacts = [
        (generate_id('art'), PROJECT_ID, 'mrd', '市场需求文档 (MRD)',
         '# 市场需求文档\n\n## 1. 市场概述\n智能客服市场规模预计2025年达到100亿美元。\n\n## 2. 目标用户\n- 中小企业客服部门\n- 大型企业客户服务中心\n\n## 3. 核心需求\n- 多渠道接入\n- 智能路由分发\n- 知识库管理\n- 数据分析报表',
         1, 'concept', '{}', None, now, now),
        (generate_id('art'), PROJECT_ID, 'competitive_analysis', '竞品分析报告',
         '# 竞品分析报告\n\n## 主要竞品\n1. Zendesk - 功能全面，价格较高\n2. Intercom - 用户体验优秀\n3. 网易七鱼 - 国内领先\n\n## 差异化优势\n- AI 驱动的智能路由\n- 多模态交互支持\n- 灵活的定制能力',
         1, 'concept', '{}', None, now, now),
        (generate_id('art'), PROJECT_ID, 'business_case', '商业论证报告',
         '# 商业论证报告\n\n## 投资概要\n- 项目总投资: 50万元\n- 预期回报周期: 18个月\n- ROI: 150%\n\n## 成本分析\n- 研发成本: 30万元\n- 运营成本: 15万元\n- 市场推广: 5万元\n\n## 收益预测\n- 第一年: 30万元\n- 第二年: 80万元\n- 第三年: 150万元',
         1, 'concept', '{}', None, now, now),
    ]
    cur.executemany("""
        INSERT INTO artifacts (id, project_id, artifact_type, name, content, version, stage, ai_metadata, deleted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, artifacts)
    print(f"已插入 {len(artifacts)} 条产出物")

# 3. 创建审核问题 (review_issues 表)
cur.execute("SELECT COUNT(*) FROM review_issues WHERE project_id = ?", (PROJECT_ID,))
count = cur.fetchone()[0]
print(f"当前审核问题数量: {count}")

if count == 0:
    review_issues = [
        (generate_id('iss'), PROJECT_ID, 'gate_CDCP', 'MRD 缺少竞品功能对比表格', 'open', None, now),
        (generate_id('iss'), PROJECT_ID, 'gate_CDCP', '商业论证需要补充敏感度分析', 'open', None, now),
        (generate_id('iss'), PROJECT_ID, 'gate_CDCP', '建议增加用户访谈记录', 'open', None, now),
    ]
    cur.executemany("""
        INSERT INTO review_issues (id, project_id, gate_id, description, status, resolved_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, review_issues)
    print(f"已插入 {len(review_issues)} 条审核问题")

# 4. 插入 checklist 项，让 advance 可以通过
cur.execute("SELECT id FROM stage_states WHERE project_id = ? AND stage = 'concept'", (PROJECT_ID,))
row = cur.fetchone()
if row:
    stage_state_id = row[0]
    cur.execute("SELECT COUNT(*) FROM stage_checklist_items WHERE stage_state_id = ?", (stage_state_id,))
    count = cur.fetchone()[0]
    print(f"当前 checklist 项数量: {count}")
    if count == 0:
        checklist_items = [
            (generate_id('chk'), stage_state_id, 'mrd_complete', 'MRD 已完成', 1, 1, now),
            (generate_id('chk'), stage_state_id, 'business_case_approved', '商业论证已通过', 1, 1, now),
            (generate_id('chk'), stage_state_id, 'competitive_analysis_done', '竞品分析已完成', 0, 1, now),
            (generate_id('chk'), stage_state_id, 'stakeholder_signoff', '干系人已签批', 1, 1, now),
        ]
        cur.executemany("""
            INSERT INTO stage_checklist_items (id, stage_state_id, item_key, description, is_blocking, is_completed, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, checklist_items)
        print(f"已插入 {len(checklist_items)} 条 checklist 项")

conn.commit()
conn.close()
print("\n数据填充完成！")