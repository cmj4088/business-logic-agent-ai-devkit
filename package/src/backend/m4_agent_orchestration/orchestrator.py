"""编排器 — M4 Agent 编排。

实现 3 种 Agent 协作模式：parallel / sequential / debate。
"""
import uuid
import asyncio
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from shared.types import OrchestrationMode
from m3_prompt_system.renderer import PromptRenderer, ROLE_NAMES
from m3_prompt_system.context_builder import build_context
from .llm_router import LLMRouter
from .deadlock_detector import DeadlockDetector
from .output_parser import extract_json_with_retry
from .language_detector import check_language
from .reasoning_summarizer import generate_reasoning_summary
from m7_plugin_system.tool_bridge import SkillToolBridge


def generate_round_id() -> str:
    return f"round_{uuid.uuid4().hex[:12]}"


class Orchestrator:
    """Agent 编排器。"""

    def __init__(self, db: AsyncSession, user_id: str | None = None):
        self.db = db
        self.user_id = user_id
        self.router = LLMRouter(db=db, user_id=user_id)
        self.renderer = PromptRenderer()

    async def orchestrate(
        self,
        project_id: str,
        stage: str,
        activity_key: str,
        mode: OrchestrationMode,
        agents: list[str],
        user_input: str = "",
        max_rounds: int = 3,
    ) -> dict:
        """执行 Agent 编排。

        Args:
            project_id: 项目 ID
            stage: 当前阶段
            activity_key: 活动标识
            mode: 编排模式
            agents: 参与的 Agent 角色列表
            user_input: 用户附加上下文
            max_rounds: 最大辩论轮次

        Returns:
            编排结果，包含 round_id, outputs, summary, tokens
        """
        round_id = generate_round_id()

        # 构建上下文
        context = await build_context(self.db, project_id, stage, user_input)
        # 注入活动标识，供 mock provider 识别活动类型
        context["activity_key"] = activity_key

        # 根据模式执行
        if mode == OrchestrationMode.PARALLEL:
            outputs = await self._run_parallel(agents, context)
        elif mode == OrchestrationMode.SEQUENTIAL:
            outputs = await self._run_sequential(agents, context)
        elif mode == OrchestrationMode.DEBATE:
            outputs = await self._run_debate(agents, context, max_rounds)
        else:
            outputs = []

        # 生成摘要
        summary = generate_reasoning_summary(outputs)

        # 计算总 Token
        total_tokens = {
            "input": sum(o.get("tokens", {}).get("input", 0) for o in outputs),
            "output": sum(o.get("tokens", {}).get("output", 0) for o in outputs),
        }

        # 记录到数据库
        await self._save_round(round_id, project_id, stage, activity_key, mode.value, agents, outputs, summary, total_tokens)

        return {
            "round_id": round_id,
            "mode": mode.value,
            "outputs": outputs,
            "summary": summary,
            "tokens": total_tokens,
        }

    async def _run_parallel(self, agents: list[str], context: dict) -> list[dict]:
        """并行模式：所有 Agent 同时独立输出。"""
        async def run_agent(agent: str) -> dict:
            return await self._invoke_agent(agent, context)

        results = await asyncio.gather(*[run_agent(a) for a in agents])
        return list(results)

    async def _run_sequential(self, agents: list[str], context: dict) -> list[dict]:
        """顺序模式：Agent A 输出 → Agent B 基于 A 输出继续。"""
        outputs = []
        shared_context = dict(context)

        for i, agent in enumerate(agents):
            if i > 0:
                # 将前一个 Agent 的输出作为上下文
                prev_output = outputs[-1].get("content", "")
                shared_context["previous_output"] = prev_output
                shared_context["user_input"] = f"前一个 Agent ({agents[i-1]}) 的输出：\n{prev_output}\n\n初始任务：{context.get('user_input', '')}"

            output = await self._invoke_agent(agent, shared_context)
            outputs.append(output)

        return outputs

    async def _run_debate(self, agents: list[str], context: dict, max_rounds: int) -> list[dict]:
        """辩论模式：多轮辩论，直到达成共识或死循环检测触发。"""
        detector = DeadlockDetector()
        all_outputs = []

        for round_num in range(1, max_rounds + 1):
            round_outputs = []
            debate_context = dict(context)
            debate_context["user_input"] = f"辩论第 {round_num} 轮。\n{context.get('user_input', '')}"

            # 添加之前所有轮的输出作为上下文
            if all_outputs:
                previous_summary = "\n".join([
                    f"{o['role']} (第{o.get('round', '?')}轮): {o.get('content', '')[:200]}"
                    for o in all_outputs[-len(agents):]
                ])
                debate_context["user_input"] += f"\n\n之前的讨论：\n{previous_summary}"

            for agent in agents:
                output = await self._invoke_agent(agent, debate_context)
                output["round"] = round_num
                round_outputs.append(output)
                all_outputs.append(output)

            # 死循环检测
            round_text = " ".join([o.get("content", "") for o in round_outputs])
            if detector.add_round(round_text):
                break

        return all_outputs

    async def _invoke_agent(self, agent_role: str, context: dict) -> dict:
        """调用单个 Agent。"""
        # 渲染 system prompt
        system_prompt = self.renderer.render(agent_role, context)
        # 注入角色标记，供 mock provider 精确识别（真实 LLM 会忽略此注释）
        system_prompt = f"<!-- AGENT_ROLE: {agent_role} -->\n{system_prompt}"

        # 注入 Skill 工具列表，使 Agent 知道可调用的技能
        skill_tools = self._get_skill_tools(context)
        if skill_tools:
            system_prompt += f"\n\n## 可用技能工具\n\n你可以通过以下技能工具生成产出物。在回复中说明需要调用的工具名称和参数即可。\n\n"
            for tool in skill_tools:
                system_prompt += f"- **{tool['tool_name']}** ({tool['skill_name']}): {tool.get('description', '')}\n"
            system_prompt += f"\n调用格式：`[调用工具: tool_name, 参数1: 值1, 参数2: 值2]`\n"

        user_message = context.get("user_input", "")
        # 将活动标识加入消息，供 mock 识别活动类型
        activity_key = context.get("activity_key", "")
        if activity_key:
            user_message = f"[活动: {activity_key}]\n{user_message}"

        # 调用 LLM（最多重试 3 次）
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                result = await self.router.call(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    provider="deepseek",
                    max_tokens=8192,
                )

                content = result["content"]

                # 语言检测
                is_chinese, reason = check_language(content)
                if not is_chinese and attempt < max_attempts - 1:
                    user_message = f"请用中文回答。\n{user_message}"
                    continue

                return {
                    "role": agent_role,
                    "role_name": ROLE_NAMES.get(agent_role, agent_role),
                    "content": content,
                    "model": result["model"],
                    "provider": result["provider"],
                    "tokens": result["tokens"],
                }
            except Exception as e:
                if attempt == max_attempts - 1:
                    return {
                        "role": agent_role,
                        "role_name": ROLE_NAMES.get(agent_role, agent_role),
                        "content": f"[调用失败: {str(e)}]",
                        "model": "unknown",
                        "provider": "unknown",
                        "tokens": {"input": 0, "output": 0},
                        "error": str(e),
                    }

        return {
            "role": agent_role,
            "content": "[调用失败]",
            "model": "unknown",
            "provider": "unknown",
            "tokens": {"input": 0, "output": 0},
        }

    def _get_skill_tools(self, context: dict) -> list[dict]:
        """获取当前上下文相关的 Skill 工具列表。

        根据当前阶段和活动类型，返回可用的 Skill 工具。
        Agent 可以在编排过程中调用这些工具生成产出物。

        Args:
            context: 编排上下文（包含 project_id, stage, activity_key 等）。

        Returns:
            Skill 工具列表，每个工具包含 tool_name, skill_name, description。
        """
        try:
            bridge = SkillToolBridge()
            tools = bridge.get_all_tools()
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise

        # 根据阶段过滤工具（可选）
        stage_val = context.get("stage", "")
        if isinstance(stage_val, dict):
            stage_val = stage_val.get("name", "")
        activity_key = context.get("activity_key", "")

        # 阶段到 Skill 的映射
        stage_skill_map = {
            "concept": ["ipd-docx"],        # 概念阶段：需要 MRD/PRD 文档
            "plan": ["ipd-data-analysis", "ipd-xlsx", "ipd-docx"],  # 计划阶段：分析+文档+Excel
            "development": ["ipd-xlsx"],    # 开发阶段：测试用例
            "verification": ["ipd-data-analysis", "ipd-docx"],  # 验证阶段：质量分析+测试报告
            "launch": ["ipd-data-analysis", "ipd-docx", "ipd-xlsx"],  # 发布阶段：市场分析+方案
            "lifecycle": ["ipd-data-analysis", "ipd-docx"],  # 生命周期：财务分析+报告
        }

        allowed_skills = stage_skill_map.get(stage_val, [])
        if allowed_skills:
            tools = [t for t in tools if t["skill_name"] in allowed_skills]

        return tools

    async def _save_round(
        self, round_id: str, project_id: str, stage: str, activity_key: str,
        mode: str, agents: list[str], outputs: list[dict], summary: str, tokens: dict,
    ) -> None:
        """保存编排轮次到数据库。"""
        import json
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # 保存到 usage_records
        for output in outputs:
            t = output.get("tokens", {})
            if t.get("input", 0) > 0 or t.get("output", 0) > 0:
                record_id = f"usage_{uuid.uuid4().hex[:12]}"
                await self.db.execute(
                    text("""INSERT INTO usage_records (id, project_id, model, input_tokens, output_tokens, cost_usd, created_at)
                            VALUES (:id, :project_id, :model, :input_tokens, :output_tokens, :cost_usd, :created_at)"""),
                    {
                        "id": record_id,
                        "project_id": project_id,
                        "model": output.get("model", "unknown"),
                        "input_tokens": t.get("input", 0),
                        "output_tokens": t.get("output", 0),
                        "cost_usd": 0.0,  # Ollama 免费
                        "created_at": now,
                    }
                )

        await self.db.commit()