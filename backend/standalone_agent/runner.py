"""Standalone Agent Runner — 独立智能体启动器。

通过命令行启动一个独立的 IPD Agent 服务。

用法：
    # 从项目根目录启动（推荐）
    cd /path/to/Business-logic-agents
    PYTHONPATH="backend;." python -m backend.standalone_agent.runner --role product_manager --port 8001

    # 从 backend 目录启动
    cd backend
    PYTHONPATH=".." python -m standalone_agent.runner --role product_manager --port 8001

    # 从 manifest JSON 文件启动
    python -m backend.standalone_agent.runner --manifest /path/to/manifest.json --port 8001
"""
import argparse
import json
import logging
import os
import sys
import uvicorn

# 自动修复 PYTHONPATH
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
_project_root = os.path.dirname(_backend_dir)
for p in [_project_root, _backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from .manifest import AgentManifest, AgentCapability
from .server import create_agent_app
from m3_prompt_system.renderer import ROLE_NAMES

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("standalone_agent")


def main():
    parser = argparse.ArgumentParser(
        description="BLA Standalone Agent — 独立部署的 IPD 智能体服务",
    )
    parser.add_argument("--role", type=str, default=None,
                        help="Agent 角色（product_manager/rd/qa/marketing/manufacturing/finance）")
    parser.add_argument("--port", type=int, default=8001,
                        help="服务端口（默认 8001）")
    parser.add_argument("--host", type=str, default="0.0.0.0",
                        help="监听地址（默认 0.0.0.0）")
    parser.add_argument("--manifest", type=str, default=None,
                        help="Manifest JSON 文件路径（替代 --role）")
    parser.add_argument("--register", type=str, default=None,
                        help="启动后注册到主引擎 URL（可选）")
    parser.add_argument("--model", type=str, default=None,
                        help="默认模型（可选）")

    args = parser.parse_args()

    # 确定角色和 Manifest
    if args.manifest:
        # 从 JSON 文件加载
        with open(args.manifest, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)
        manifest = AgentManifest(**manifest_data)
        role = manifest.role
    elif args.role:
        role = args.role
        # 自动生成 Manifest
        capabilities = _get_role_capabilities(role)
        manifest = AgentManifest(
            id=role,
            name=ROLE_NAMES.get(role, role),
            role=role,
            description=f"{ROLE_NAMES.get(role, role)} — IPD 智能体服务",
            capabilities=capabilities,
            default_model=args.model or "ollama",
        )
    else:
        parser.print_help()
        print("\n错误: 请指定 --role 或 --manifest")
        sys.exit(1)

    # 创建应用
    app = create_agent_app(role, manifest)

    # 打印启动信息
    print(f"""
╔══════════════════════════════════════════╗
║   BLA Standalone Agent                  ║
║   {manifest.name} ({role})            ║
║   v{manifest.version}                   ║
╠══════════════════════════════════════════╣
║   服务地址: http://{args.host}:{args.port}    ║
║   健康检查: http://{args.host}:{args.port}/health  ║
║   清单信息: http://{args.host}:{args.port}/manifest  ║
║   推理接口: POST http://{args.host}:{args.port}/infer  ║
║   默认模型: {manifest.default_model}                 ║
╚══════════════════════════════════════════╝""")

    # 启动服务
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


def _get_role_capabilities(role: str) -> AgentCapability:
    """获取角色对应的默认能力声明。"""
    capabilities_map = {
        "product_manager": AgentCapability(
            applicable_stages=["concept", "plan", "launch"],
            applicable_activities=["market_research", "mrd_writing", "prd_writing", "dcp_review"],
            description="需求分析、市场调研、产品定义、MRD/PRD 撰写",
            output_types=["mrd", "prd", "competitor_analysis", "roadmap"],
        ),
        "rd": AgentCapability(
            applicable_stages=["concept", "plan", "develop", "verify"],
            applicable_activities=["tech_evaluation", "system_design", "code_review", "tr_review"],
            description="技术评估、系统架构设计、技术评审、风险分析",
            output_types=["system_design", "tech_risk_report", "architecture_diagram"],
        ),
        "qa": AgentCapability(
            applicable_stages=["plan", "develop", "verify"],
            applicable_activities=["test_planning", "test_case_writing", "test_execution", "quality_report"],
            description="测试策略、测试用例设计、质量评估、自动化测试",
            output_types=["test_plan", "test_case", "test_report", "quality_report"],
        ),
        "marketing": AgentCapability(
            applicable_stages=["concept", "plan", "launch", "lifecycle"],
            applicable_activities=["market_analysis", "competitor_analysis", "gtm_planning", "pricing"],
            description="市场分析、竞品分析、GTM 计划、定价策略",
            output_types=["market_report", "competitor_analysis", "gtm_plan", "pricing_strategy"],
        ),
        "manufacturing": AgentCapability(
            applicable_stages=["plan", "develop", "verify", "launch"],
            applicable_activities=["bom_estimation", "dfm_review", "supply_chain", "cost_analysis"],
            description="BOM 估算、DFM 审查、供应链评估、制造成本分析",
            output_types=["bom", "dfm_report", "supply_chain_report", "manufacturing_cost"],
        ),
        "finance": AgentCapability(
            applicable_stages=["concept", "plan", "launch", "lifecycle"],
            applicable_activities=["business_case", "cost_accounting", "roi_analysis", "budget"],
            description="商业论证、成本核算、ROI 分析、预算管理",
            output_types=["business_case", "cost_report", "roi_analysis", "budget_report"],
        ),
    }
    return capabilities_map.get(role, AgentCapability())


if __name__ == "__main__":
    main()
