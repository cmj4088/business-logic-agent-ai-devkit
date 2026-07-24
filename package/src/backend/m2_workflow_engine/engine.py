"""核心工作流引擎 — M2。

负责复杂度判定、阶段推进、活动裁剪、门禁判定。
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from shared.types import IPDStage, ComplexityTier
from shared.errors import ErrorCode, AppException
from m0_infrastructure.config import get_settings


def generate_project_id() -> str:
    return f"proj_{uuid.uuid4().hex[:12]}"


def generate_stage_id() -> str:
    return f"stage_{uuid.uuid4().hex[:12]}"


def generate_gate_id() -> str:
    return f"gate_{uuid.uuid4().hex[:12]}"


def generate_activity_id() -> str:
    return f"act_{uuid.uuid4().hex[:12]}"


# 阶段顺序
STAGE_ORDER = [
    IPDStage.CONCEPT,
    IPDStage.PLAN,
    IPDStage.DEVELOP,
    IPDStage.VERIFY,
    IPDStage.LAUNCH,
    IPDStage.LIFECYCLE,
]

# 门禁定义（每个阶段结束时的门禁）
STAGE_GATES = {
    IPDStage.CONCEPT: ["CDCP"],
    IPDStage.PLAN: ["PDCP"],
    IPDStage.DEVELOP: ["TR3", "TR4"],
    IPDStage.VERIFY: ["TR5", "TR6"],
    IPDStage.LAUNCH: ["ADCP"],
    IPDStage.LIFECYCLE: ["LDCP"],
}

# 默认活动定义（lite 模式 24 个活动）
DEFAULT_ACTIVITIES = {
    IPDStage.CONCEPT: [
        {"key": "customer_needs", "name": "客户需求调研", "human_input_required": False},
        {"key": "competitive_analysis", "name": "竞品分析", "human_input_required": False},
        {"key": "business_case", "name": "商业论证", "human_input_required": False},
        {"key": "mrd_draft", "name": "MRD 撰写", "human_input_required": False},
    ],
    IPDStage.PLAN: [
        {"key": "prd_draft", "name": "PRD 撰写", "human_input_required": False},
        {"key": "system_design", "name": "系统架构设计", "human_input_required": False},
        {"key": "bom_estimate", "name": "BOM 与成本估算", "human_input_required": False},
        {"key": "risk_assessment", "name": "风险评估", "human_input_required": False},
        {"key": "pdcp_prep", "name": "PDCP 材料准备", "human_input_required": False},
    ],
    IPDStage.DEVELOP: [
        {"key": "detailed_design", "name": "详细设计文档", "human_input_required": True},
        {"key": "unit_test", "name": "单元测试报告", "human_input_required": False},
        {"key": "tr4_review", "name": "TR4 评审报告", "human_input_required": False},
        {"key": "test_cases", "name": "测试用例集", "human_input_required": False},
    ],
    IPDStage.VERIFY: [
        {"key": "system_test", "name": "系统测试报告", "human_input_required": False},
        {"key": "tr5_review", "name": "TR5 评审报告", "human_input_required": False},
        {"key": "tr6_review", "name": "TR6 评审报告", "human_input_required": False},
        {"key": "adcp_prep", "name": "ADCP 材料准备", "human_input_required": False},
    ],
    IPDStage.LAUNCH: [
        {"key": "gtm_plan", "name": "GTM 执行计划", "human_input_required": False},
        {"key": "production_report", "name": "首批生产报告", "human_input_required": True},
    ],
    IPDStage.LIFECYCLE: [
        {"key": "ops_review", "name": "运营评审报告", "human_input_required": False},
        {"key": "iteration_plan", "name": "迭代需求清单", "human_input_required": False},
    ],
}

# Exit Criteria（门禁阻断条件）
EXIT_CRITERIA = {
    "CDCP": [
        {"key": "mrd_complete", "description": "MRD 已完成", "is_blocking": True},
        {"key": "business_case_approved", "description": "商业论证已通过", "is_blocking": True},
        {"key": "competitive_analysis_done", "description": "竞品分析已完成", "is_blocking": False},
        {"key": "stakeholder_signoff", "description": "干系人已签批", "is_blocking": True},
    ],
    "PDCP": [
        {"key": "prd_complete", "description": "PRD 已完成", "is_blocking": True},
        {"key": "design_review_done", "description": "设计评审已完成", "is_blocking": True},
        {"key": "budget_approved", "description": "预算已批准", "is_blocking": True},
        {"key": "risk_mitigation_plan", "description": "风险缓解计划就绪", "is_blocking": False},
    ],
    "TR3": [
        {"key": "detailed_design_complete", "description": "详细设计已完成", "is_blocking": True},
        {"key": "unit_test_pass", "description": "单元测试通过", "is_blocking": True},
    ],
    "TR4": [
        {"key": "test_cases_reviewed", "description": "测试用例已评审", "is_blocking": True},
        {"key": "integration_test_plan", "description": "集成测试计划就绪", "is_blocking": False},
    ],
    "TR5": [
        {"key": "system_test_pass", "description": "系统测试通过", "is_blocking": True},
        {"key": "bug_critical_zero", "description": "无严重遗留Bug", "is_blocking": True},
    ],
    "TR6": [
        {"key": "production_ready", "description": "生产就绪", "is_blocking": True},
        {"key": "supply_chain_ready", "description": "供应链就绪", "is_blocking": False},
    ],
    "ADCP": [
        {"key": "gtm_plan_approved", "description": "GTM 计划已批准", "is_blocking": True},
        {"key": "launch_readiness", "description": "发布就绪检查通过", "is_blocking": True},
    ],
    "LDCP": [
        {"key": "ops_review_complete", "description": "运营评审已完成", "is_blocking": True},
        {"key": "iteration_backlog", "description": "迭代需求清单就绪", "is_blocking": False},
    ],
}

# 活动-Agent 映射表：每个活动需要哪些 Agent、编排模式、产出物类型
ACTIVITY_AGENT_MAP: dict[str, dict] = {
    # CONCEPT 阶段
    "customer_needs": {"agents": ["product_manager", "marketing"], "mode": "parallel", "artifact_type": "customer_needs", "artifact_name": "客户需求调研报告"},
    "competitive_analysis": {"agents": ["marketing"], "mode": "parallel", "artifact_type": "competitive_analysis", "artifact_name": "竞品分析报告"},
    "business_case": {"agents": ["finance", "product_manager"], "mode": "sequential", "artifact_type": "business_case", "artifact_name": "商业论证报告"},
    "mrd_draft": {"agents": ["product_manager"], "mode": "parallel", "artifact_type": "mrd", "artifact_name": "MRD 市场需求文档"},
    # PLAN 阶段
    "prd_draft": {"agents": ["product_manager"], "mode": "parallel", "artifact_type": "prd", "artifact_name": "PRD 产品需求文档"},
    "system_design": {"agents": ["rd"], "mode": "parallel", "artifact_type": "system_design", "artifact_name": "系统架构设计文档"},
    "bom_estimate": {"agents": ["manufacturing", "finance"], "mode": "sequential", "artifact_type": "bom", "artifact_name": "BOM 与成本估算"},
    "risk_assessment": {"agents": ["rd", "finance", "manufacturing"], "mode": "parallel", "artifact_type": "risk_assessment", "artifact_name": "风险评估报告"},
    "pdcp_prep": {"agents": ["product_manager", "rd"], "mode": "sequential", "artifact_type": "pdcp_material", "artifact_name": "PDCP 评审材料"},
    # DEVELOP 阶段
    "detailed_design": {"agents": ["rd"], "mode": "parallel", "artifact_type": "detailed_design", "artifact_name": "详细设计文档"},
    "unit_test": {"agents": ["qa", "rd"], "mode": "sequential", "artifact_type": "unit_test_report", "artifact_name": "单元测试报告"},
    "tr4_review": {"agents": ["rd", "qa"], "mode": "debate", "artifact_type": "tr4_report", "artifact_name": "TR4 评审报告"},
    "test_cases": {"agents": ["qa"], "mode": "parallel", "artifact_type": "test_cases", "artifact_name": "测试用例集"},
    # VERIFY 阶段
    "system_test": {"agents": ["qa"], "mode": "parallel", "artifact_type": "system_test_report", "artifact_name": "系统测试报告"},
    "tr5_review": {"agents": ["rd", "qa"], "mode": "debate", "artifact_type": "tr5_report", "artifact_name": "TR5 评审报告"},
    "tr6_review": {"agents": ["rd", "qa", "manufacturing"], "mode": "debate", "artifact_type": "tr6_report", "artifact_name": "TR6 评审报告"},
    "adcp_prep": {"agents": ["product_manager", "marketing", "finance"], "mode": "parallel", "artifact_type": "adcp_material", "artifact_name": "ADCP 评审材料"},
    # LAUNCH 阶段
    "gtm_plan": {"agents": ["marketing"], "mode": "parallel", "artifact_type": "gtm_plan", "artifact_name": "GTM 执行计划"},
    "production_report": {"agents": ["manufacturing"], "mode": "parallel", "artifact_type": "production_report", "artifact_name": "首批生产报告"},
    # LIFECYCLE 阶段
    "ops_review": {"agents": ["product_manager", "finance"], "mode": "parallel", "artifact_type": "ops_review", "artifact_name": "运营评审报告"},
    "iteration_plan": {"agents": ["product_manager"], "mode": "parallel", "artifact_type": "iteration_plan", "artifact_name": "迭代需求清单"},
}


def determine_complexity(team_size: int, industry: str, certification_count: int = 0, bom_items: int = 0, has_hardware: bool = True) -> ComplexityTier:
    """复杂度自动判定。"""
    if industry in ("医疗器械", "汽车电子", "航空"):
        return ComplexityTier.FULL
    if certification_count >= 3:
        return ComplexityTier.FULL
    if team_size <= 3 and bom_items <= 20 and not has_hardware:
        return ComplexityTier.LITE
    return ComplexityTier.STANDARD


def get_visible_activities(stage: IPDStage, complexity: ComplexityTier) -> list[dict]:
    """根据复杂度裁剪活动列表。"""
    all_activities = DEFAULT_ACTIVITIES.get(stage, [])
    # lite 模式返回全部（24 个活动），standard 和 full 预留扩展
    return all_activities


def get_next_stage(current_stage: IPDStage) -> IPDStage | None:
    """获取下一个阶段。"""
    try:
        idx = STAGE_ORDER.index(current_stage)
        if idx < len(STAGE_ORDER) - 1:
            return STAGE_ORDER[idx + 1]
        return None
    except ValueError:
        return None


def get_previous_stage(current_stage: IPDStage) -> IPDStage | None:
    """获取上一个阶段。"""
    try:
        idx = STAGE_ORDER.index(current_stage)
        if idx > 0:
            return STAGE_ORDER[idx - 1]
        return None
    except ValueError:
        return None


def get_stage_progress(stage: IPDStage) -> float:
    """计算阶段进度百分比。"""
    try:
        idx = STAGE_ORDER.index(stage)
        return round((idx + 1) / len(STAGE_ORDER) * 100, 1)
    except ValueError:
        return 0.0


class WorkflowEngine:
    """工作流引擎。"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(self, user_id: str, request) -> dict:
        """创建项目并初始化所有阶段状态。"""
        project_id = generate_project_id()

        # 复杂度判定
        complexity = determine_complexity(
            team_size=request.team_size,
            industry=request.industry,
        )

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # 创建项目
        await self.db.execute(
            text("""INSERT INTO projects (id, user_id, name, description, complexity_tier,
                    current_stage, status, progress, template_id, budget_limit,
                    team_size, target_weeks, industry, created_at, updated_at)
                    VALUES (:id, :user_id, :name, :description, :complexity_tier,
                    :current_stage, :status, :progress, :template_id, :budget_limit,
                    :team_size, :target_weeks, :industry, :created_at, :updated_at)"""),
            {
                "id": project_id, "user_id": user_id,
                "name": request.name, "description": request.description,
                "complexity_tier": complexity.value,
                "current_stage": IPDStage.CONCEPT.value,
                "status": "active", "progress": 0.0,
                "template_id": request.template_id,
                "budget_limit": request.budget_limit,
                "team_size": request.team_size,
                "target_weeks": request.target_weeks,
                "industry": request.industry,
                "created_at": now, "updated_at": now,
            }
        )

        # 初始化所有阶段状态
        for stage in STAGE_ORDER:
            stage_id = generate_stage_id()
            await self.db.execute(
                text("""INSERT INTO stage_states (id, project_id, stage, status, created_at, updated_at)
                        VALUES (:id, :project_id, :stage, :status, :created_at, :updated_at)"""),
                {
                    "id": stage_id, "project_id": project_id,
                    "stage": stage.value,
                    "status": "active" if stage == IPDStage.CONCEPT else "pending",
                    "created_at": now, "updated_at": now,
                }
            )

            # 初始化活动
            activities = get_visible_activities(stage, complexity)
            for activity in activities:
                activity_id = generate_activity_id()
                await self.db.execute(
                    text("""INSERT INTO activity_states (id, project_id, stage, activity_key,
                            status, created_at, updated_at)
                            VALUES (:id, :project_id, :stage, :activity_key,
                            :status, :created_at, :updated_at)"""),
                    {
                        "id": activity_id, "project_id": project_id,
                        "stage": stage.value, "activity_key": activity["key"],
                        "status": "pending",
                        "created_at": now, "updated_at": now,
                    }
                )

        await self.db.commit()

        return await self.get_project(project_id)

    async def get_project(self, project_id: str) -> dict:
        """获取项目详情。"""
        result = await self.db.execute(
            text("SELECT * FROM projects WHERE id = :id AND deleted_at IS NULL"),
            {"id": project_id}
        )
        project = result.fetchone()
        if project is None:
            raise AppException(ErrorCode.NOT_FOUND, "项目不存在", status_code=404)

        return {
            "id": project.id, "name": project.name,
            "description": project.description or "",
            "complexity": project.complexity_tier,
            "currentStage": project.current_stage,
            "status": project.status, "progress": project.progress or 0,
            "template_id": project.template_id,
            "budgetLimit": project.budget_limit,
            "teamSize": project.team_size,
            "targetWeeks": project.target_weeks,
            "industry": project.industry,
            "createdAt": project.created_at if isinstance(project.created_at, str) else project.created_at.isoformat() if project.created_at else None,
            "updatedAt": project.updated_at if isinstance(project.updated_at, str) else project.updated_at.isoformat() if project.updated_at else None,
        }

    async def list_projects(self, user_id: str, status: str | None = None, page: int = 1, page_size: int = 20) -> dict:
        """获取项目列表。"""
        query = "SELECT * FROM projects WHERE user_id = :user_id AND deleted_at IS NULL"
        params: dict = {"user_id": user_id}

        if status:
            query += " AND status = :status"
            params["status"] = status

        # 总数
        count_result = await self.db.execute(
            text(f"SELECT COUNT(*) as total FROM ({query})"),
            params
        )
        total = count_result.fetchone().total

        # 分页
        offset = (page - 1) * page_size
        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        params["limit"] = page_size
        params["offset"] = offset

        result = await self.db.execute(text(query), params)
        projects = result.fetchall()

        return {
            "items": [
                {
                    "id": p.id, "name": p.name,
                    "description": p.description or "",
                    "complexity": p.complexity_tier,
                    "currentStage": p.current_stage,
                    "status": p.status, "progress": p.progress or 0,
                    "createdAt": p.created_at if isinstance(p.created_at, str) else p.created_at.isoformat() if p.created_at else None,
                    "updatedAt": p.updated_at if isinstance(p.updated_at, str) else p.updated_at.isoformat() if p.updated_at else None,
                }
                for p in projects
            ],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": max(1, (total + page_size - 1) // page_size) if total > 0 else 0,
        }

    async def advance_stage(self, project_id: str) -> dict:
        """推进到下一阶段。"""
        project = await self.get_project(project_id)
        current_stage = IPDStage(project["currentStage"])
        next_stage = get_next_stage(current_stage)

        if next_stage is None:
            raise AppException(ErrorCode.VALIDATION_ERROR, "已是最后一个阶段", status_code=422)

        # 检查门禁条件
        gates = STAGE_GATES.get(current_stage, [])
        blocking_items = []
        for gate_id in gates:
            criteria = EXIT_CRITERIA.get(gate_id, [])
            for c in criteria:
                if c["is_blocking"]:
                    # 检查是否已完成
                    result = await self.db.execute(
                        text("""SELECT id FROM stage_checklist_items
                                WHERE stage_state_id IN (SELECT id FROM stage_states WHERE project_id = :project_id AND stage = :stage)
                                AND item_key = :item_key AND is_completed = 1"""),
                        {"project_id": project_id, "stage": current_stage.value, "item_key": c["key"]}
                    )
                    if result.fetchone() is None:
                        blocking_items.append(c["description"])

        if blocking_items:
            raise AppException(
                ErrorCode.VALIDATION_ERROR,
                f"以下阻断项未完成: {', '.join(blocking_items)}",
                status_code=422
            )

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        progress = get_stage_progress(next_stage)

        # 更新当前阶段
        await self.db.execute(
            text("""UPDATE stage_states SET status = 'completed', completed_at = :now, updated_at = :now
                    WHERE project_id = :project_id AND stage = :stage"""),
            {"project_id": project_id, "stage": current_stage.value, "now": now}
        )

        # 激活下一阶段
        await self.db.execute(
            text("""UPDATE stage_states SET status = 'active', started_at = :now, updated_at = :now
                    WHERE project_id = :project_id AND stage = :stage"""),
            {"project_id": project_id, "stage": next_stage.value, "now": now}
        )

        # 更新项目
        await self.db.execute(
            text("""UPDATE projects SET current_stage = :stage, progress = :progress, updated_at = :now
                    WHERE id = :id"""),
            {"id": project_id, "stage": next_stage.value, "progress": progress, "now": now}
        )

        await self.db.commit()
        return await self.get_project(project_id)

    async def rollback_stage(self, project_id: str) -> dict:
        """回退到上一阶段。"""
        project = await self.get_project(project_id)
        current_stage = IPDStage(project["currentStage"])
        previous_stage = get_previous_stage(current_stage)

        if previous_stage is None:
            raise AppException(ErrorCode.VALIDATION_ERROR, "已是第一个阶段，无法回退", status_code=422)

        # 检查回退次数
        settings = get_settings()
        result = await self.db.execute(
            text("SELECT COUNT(*) as count FROM gate_results WHERE project_id = :project_id AND vote = 'rollback'"),
            {"project_id": project_id}
        )
        rollback_count = result.fetchone().count
        if rollback_count >= settings.max_rollback_count:
            raise AppException(ErrorCode.VALIDATION_ERROR, f"已达到最大回退次数（{settings.max_rollback_count}次）", status_code=422)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        progress = get_stage_progress(previous_stage)

        # 停用当前阶段
        await self.db.execute(
            text("""UPDATE stage_states SET status = 'pending', updated_at = :now
                    WHERE project_id = :project_id AND stage = :stage"""),
            {"project_id": project_id, "stage": current_stage.value, "now": now}
        )

        # 重新激活上一阶段
        await self.db.execute(
            text("""UPDATE stage_states SET status = 'active', completed_at = NULL, updated_at = :now
                    WHERE project_id = :project_id AND stage = :stage"""),
            {"project_id": project_id, "stage": previous_stage.value, "now": now}
        )

        # 更新项目
        await self.db.execute(
            text("""UPDATE projects SET current_stage = :stage, progress = :progress, updated_at = :now
                    WHERE id = :id"""),
            {"id": project_id, "stage": previous_stage.value, "progress": progress, "now": now}
        )

        await self.db.commit()
        return await self.get_project(project_id)

    async def get_stage_detail(self, project_id: str, stage: str) -> dict:
        """获取阶段详情（活动 + 门禁 + 小组件）。"""
        # 活动列表
        result = await self.db.execute(
            text("SELECT * FROM activity_states WHERE project_id = :project_id AND stage = :stage ORDER BY created_at"),
            {"project_id": project_id, "stage": stage}
        )
        activities = []
        for row in result.fetchall():
            # 查找活动名称
            activity_name = row.activity_key
            for act in DEFAULT_ACTIVITIES.get(IPDStage(stage), []):
                if act["key"] == row.activity_key:
                    activity_name = act["name"]
                    break
            activities.append({
                "id": row.id, "key": row.activity_key,
                "name": activity_name, "status": row.status,
                "started_at": row.started_at, "completed_at": row.completed_at,
            })

        # 门禁状态
        gates = STAGE_GATES.get(IPDStage(stage), [])
        gate_statuses = []
        for gate_id in gates:
            result = await self.db.execute(
                text("""SELECT * FROM gate_results WHERE project_id = :project_id AND gate_id = :gate_id
                        ORDER BY attempt DESC LIMIT 1"""),
                {"project_id": project_id, "gate_id": gate_id}
            )
            latest = result.fetchone()
            gate_statuses.append({
                "gate_id": gate_id,
                "status": latest.vote if latest else "pending",
                "criteria": EXIT_CRITERIA.get(gate_id, []),
                "is_auto_approved": bool(latest.is_auto_approved) if latest else False,
            })

        # 侧边栏小组件
        widgets = {
            "budget": {"status": "green", "deviation": 5.0, "detail": "偏差 5%"},
            "supply_chain": {"status": "green", "detail": "全部正常"},
            "certification": {"status": "gray", "detail": "不适用"},
            "competitor": {"status": "gray", "detail": "暂无数据"},
        }

        return {
            "stage": stage,
            "status": "active",
            "activities": activities,
            "gates": gate_statuses,
            "widgets": widgets,
        }

    async def get_current_stage_detail(self, project_id: str) -> dict:
        """获取当前阶段详情（供前端 /api/projects/{id}/stage 调用）。

        返回前端期望的格式：{currentStage: StageDetail, allStages: StageDetail[]}
        """
        project = await self.get_project(project_id)
        current_stage = project["currentStage"]

        # 阶段标签和描述
        stage_labels = {
            "concept": "概念", "plan": "计划", "develop": "开发",
            "verify": "验证", "launch": "发布", "lifecycle": "生命周期",
        }
        stage_descriptions = {
            "concept": "市场分析、客户需求调研、产品概念定义",
            "plan": "制定产品规格、项目计划、资源分配",
            "develop": "产品设计、原型开发、技术实现",
            "verify": "测试验证、质量保障、合规审查",
            "launch": "产品发布、市场推广、供应链准备",
            "lifecycle": "产品运维、客户支持、持续改进",
        }

        # 构建 allStages
        all_stages = []
        for s in STAGE_ORDER:
            s_val = s.value if hasattr(s, "value") else str(s)
            all_stages.append({
                "stage": s_val,
                "label": stage_labels.get(s_val, s_val),
                "description": stage_descriptions.get(s_val, ""),
                "status": "current" if s_val == current_stage else (
                    "completed" if STAGE_ORDER.index(s) < STAGE_ORDER.index(IPDStage(current_stage)) else "pending"
                ),
                "startedAt": None,
                "completedAt": None,
            })

        # 当前阶段详情
        current_idx = STAGE_ORDER.index(IPDStage(current_stage))
        current_stage_detail = all_stages[current_idx]

        return {
            "currentStage": current_stage_detail,
            "allStages": all_stages,
        }

    async def get_activities(self, project_id: str) -> list[dict]:
        """获取当前阶段活动列表（供前端 /api/projects/{id}/activities 调用）。"""
        project = await self.get_project(project_id)
        result = await self.db.execute(
            text("SELECT * FROM activity_states WHERE project_id = :project_id AND stage = :stage ORDER BY created_at"),
            {"project_id": project_id, "stage": project["currentStage"]}
        )
        activities = []
        for row in result.fetchall():
            activity_name = row.activity_key
            activity_desc = ""
            for act in DEFAULT_ACTIVITIES.get(IPDStage(project["currentStage"]), []):
                if act["key"] == row.activity_key:
                    activity_name = act["name"]
                    activity_desc = act.get("description", act["name"])
                    break
            activities.append({
                "id": row.id, "key": row.activity_key,
                "name": activity_name,
                "description": activity_desc,
                "status": row.status,
                "isSkippable": True,
                "assignee": None,
                "deadline": None,
                "human_input_required": False,
                "started_at": row.started_at, "completed_at": row.completed_at,
            })
        return activities

    async def get_gates(self, project_id: str) -> list[dict]:
        """获取当前阶段门禁状态（供前端 /api/projects/{id}/gates 调用）。

        返回前端期望的格式：[{name, label, stage, status, description}]
        """
        project = await self.get_project(project_id)
        stage = IPDStage(project["currentStage"])
        gates = STAGE_GATES.get(stage, [])

        # 门禁标签和描述
        gate_labels = {
            "CDCP": "概念决策评审",
            "PDCP": "计划决策评审",
            "TR3": "技术评审 TR3",
            "TR4": "技术评审 TR4",
            "TR5": "技术评审 TR5",
            "TR6": "技术评审 TR6",
            "ADCP": "上市决策评审",
            "LDCP": "生命周期决策评审",
        }
        gate_descriptions = {
            "CDCP": "评审产品概念是否值得继续投资",
            "PDCP": "评审项目计划是否可行",
            "TR3": "评审系统设计是否满足需求",
            "TR4": "评审详细设计是否完备",
            "TR5": "评审验证测试结果",
            "TR6": "评审发布就绪状态",
            "ADCP": "评审产品是否可以上市",
            "LDCP": "评审产品生命周期管理计划",
        }

        gate_statuses = []
        for gate_id in gates:
            result = await self.db.execute(
                text("""SELECT * FROM gate_results WHERE project_id = :project_id AND gate_id = :gate_id
                        ORDER BY attempt DESC LIMIT 1"""),
                {"project_id": project_id, "gate_id": gate_id}
            )
            latest = result.fetchone()
            gate_statuses.append({
                "name": gate_id,
                "label": gate_labels.get(gate_id, gate_id),
                "stage": stage.value if hasattr(stage, "value") else str(stage),
                "status": latest.vote if latest else "pending",
                "description": gate_descriptions.get(gate_id, ""),
                # 保留原始字段供后端其他逻辑使用
                "gate_id": gate_id,
                "criteria": EXIT_CRITERIA.get(gate_id, []),
                "is_auto_approved": bool(latest.is_auto_approved) if latest else False,
            })
        return gate_statuses

    async def pause_project(self, project_id: str) -> dict:
        """暂停项目。"""
        project = await self.get_project(project_id)
        if project["status"] != "active":
            raise AppException(ErrorCode.VALIDATION_ERROR, "只有活跃项目可以暂停", status_code=422)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("UPDATE projects SET status = 'paused', updated_at = :now WHERE id = :id"),
            {"id": project_id, "now": now}
        )
        await self.db.commit()
        return await self.get_project(project_id)

    async def resume_project(self, project_id: str) -> dict:
        """恢复项目。"""
        project = await self.get_project(project_id)
        if project["status"] != "paused":
            raise AppException(ErrorCode.VALIDATION_ERROR, "只有已暂停项目可以恢复", status_code=422)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("UPDATE projects SET status = 'active', updated_at = :now WHERE id = :id"),
            {"id": project_id, "now": now}
        )
        await self.db.commit()
        return await self.get_project(project_id)

    async def submit_gate_vote(self, project_id: str, gate_id: str, voter_role: str, vote: str, comment: str = "") -> dict:
        """提交门禁投票（供前端 /api/projects/{id}/gates/{gate_id}/vote 调用）。"""
        project = await self.get_project(project_id)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        gate_result_id = generate_gate_id()

        # 检查单人模式：如果只有一个用户角色的投票记录，自动通过
        result = await self.db.execute(
            text("SELECT COUNT(DISTINCT voter_role) as cnt FROM gate_results WHERE project_id = :project_id AND gate_id = :gate_id"),
            {"project_id": project_id, "gate_id": gate_id}
        )
        voter_count = result.fetchone().cnt
        is_auto_approved = voter_count == 0  # 首个投票者即单人模式

        await self.db.execute(
            text("""INSERT INTO gate_results (id, project_id, stage, gate_id, voter_role, vote, comment,
                    is_auto_approved, attempt, created_at)
                    VALUES (:id, :project_id, :stage, :gate_id, :voter_role, :vote, :comment,
                    :is_auto_approved, 1, :created_at)"""),
            {
                "id": gate_result_id, "project_id": project_id,
                "stage": project["currentStage"],
                "gate_id": gate_id, "voter_role": voter_role,
                "vote": vote, "comment": comment,
                "is_auto_approved": is_auto_approved,
                "created_at": now,
            }
        )
        await self.db.commit()

        return {
            "gate_id": gate_id,
            "vote": vote,
            "voter_role": voter_role,
            "is_auto_approved": is_auto_approved,
            "status": "approved" if (is_auto_approved or vote == "approve") else "pending",
        }

    # ------------------------------------------------------------------
    # 活动操作（供 M2 router 协调 M4 编排时调用）
    # ------------------------------------------------------------------

    def _format_activity_row(self, row, stage: str) -> dict:
        """格式化活动行为统一字典（匹配前端 Activity 类型）。"""
        activity_name = row.activity_key
        activity_desc = ""
        is_skippable = True
        for act in DEFAULT_ACTIVITIES.get(IPDStage(stage), []):
            if act["key"] == row.activity_key:
                activity_name = act["name"]
                is_skippable = not act.get("human_input_required", False)
                break
        return {
            "id": row.id,
            "key": row.activity_key,
            "name": activity_name,
            "description": activity_desc,
            "status": row.status,
            "isSkippable": is_skippable,
            "assignee": None,
            "deadline": None,
            "startedAt": row.started_at,
            "completedAt": row.completed_at,
        }

    async def get_activity_by_id(self, project_id: str, activity_id: str) -> dict:
        """根据活动 ID 获取活动详情。"""
        result = await self.db.execute(
            text("SELECT * FROM activity_states WHERE id = :id AND project_id = :project_id"),
            {"id": activity_id, "project_id": project_id},
        )
        row = result.fetchone()
        if row is None:
            raise AppException(ErrorCode.NOT_FOUND, "活动不存在", status_code=404)
        return self._format_activity_row(row, row.stage)

    async def start_activity(self, project_id: str, activity_id: str) -> dict:
        """将活动状态更新为 in_progress。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE activity_states SET status = 'in_progress', started_at = :now, updated_at = :now
                    WHERE id = :id AND project_id = :project_id"""),
            {"id": activity_id, "project_id": project_id, "now": now},
        )
        await self.db.commit()
        return await self.get_activity_by_id(project_id, activity_id)

    async def complete_activity(self, project_id: str, activity_id: str) -> dict:
        """将活动状态更新为 completed。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE activity_states SET status = 'completed', completed_at = :now, updated_at = :now
                    WHERE id = :id AND project_id = :project_id"""),
            {"id": activity_id, "project_id": project_id, "now": now},
        )
        await self.db.commit()
        return await self.get_activity_by_id(project_id, activity_id)

    async def skip_activity(self, project_id: str, activity_id: str) -> dict:
        """将活动状态更新为 skipped。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE activity_states SET status = 'skipped', updated_at = :now
                    WHERE id = :id AND project_id = :project_id"""),
            {"id": activity_id, "project_id": project_id, "now": now},
        )
        await self.db.commit()
        return await self.get_activity_by_id(project_id, activity_id)

    async def bypass_activity(self, project_id: str, activity_id: str, option: str) -> dict:
        """旁路活动（标记为 completed，记录 bypass 选项）。"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE activity_states SET status = 'completed', completed_at = :now, updated_at = :now
                    WHERE id = :id AND project_id = :project_id"""),
            {"id": activity_id, "project_id": project_id, "now": now},
        )
        await self.db.commit()
        return await self.get_activity_by_id(project_id, activity_id)

    # ------------------------------------------------------------------
    # 消息管理
    # ------------------------------------------------------------------

    async def get_messages(self, project_id: str, stage: str | None = None) -> list[dict]:
        """获取项目消息历史。"""
        query = "SELECT * FROM messages WHERE project_id = :project_id AND deleted_at IS NULL"
        params: dict = {"project_id": project_id}
        if stage:
            query += " AND stage = :stage"
            params["stage"] = stage
        query += " ORDER BY created_at ASC"
        result = await self.db.execute(text(query), params)
        messages = []
        for row in result.fetchall():
            messages.append({
                "id": row.id,
                "projectId": row.project_id,
                "sender": row.sender,
                "senderLabel": row.sender,
                "recipient": row.recipient,
                "messageType": row.message_type,
                "content": row.content,
                "parentId": row.parent_id,
                "roundId": row.round_id,
                "stage": row.stage or "",
                "metadataJson": row.metadata_json or "{}",
                "createdAt": row.created_at if isinstance(row.created_at, str) else row.created_at.isoformat() if row.created_at else None,
            })
        return messages

    async def send_message(
        self, project_id: str, sender: str, content: str,
        message_type: str = "query", recipient: str | None = None,
        round_id: str | None = None, stage: str | None = None,
        parent_id: str | None = None, metadata: dict | None = None,
    ) -> dict:
        """保存一条消息并返回。"""
        import json as _json
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        if stage is None:
            project = await self.get_project(project_id)
            stage = project["currentStage"]
        metadata_json = _json.dumps(metadata or {}, ensure_ascii=False)
        await self.db.execute(
            text("""INSERT INTO messages (id, project_id, sender, recipient, message_type, content,
                    parent_id, round_id, stage, metadata_json, created_at)
                    VALUES (:id, :project_id, :sender, :recipient, :message_type, :content,
                    :parent_id, :round_id, :stage, :metadata_json, :created_at)"""),
            {
                "id": msg_id, "project_id": project_id,
                "sender": sender, "recipient": recipient,
                "message_type": message_type, "content": content,
                "parent_id": parent_id, "round_id": round_id,
                "stage": stage, "metadata_json": metadata_json,
                "created_at": now,
            },
        )
        await self.db.commit()
        return {
            "id": msg_id,
            "projectId": project_id,
            "sender": sender,
            "senderLabel": sender,
            "recipient": recipient,
            "messageType": message_type,
            "content": content,
            "parentId": parent_id,
            "roundId": round_id,
            "stage": stage,
            "metadataJson": metadata_json,
            "createdAt": now,
        }