"""LLM Router — M4 Agent 编排。

统一的 LLM 调用接口，支持 Ollama/Anthropic/OpenAI/DeepSeek 降级链。
"""
import time
import httpx
from typing import Any
from m0_infrastructure.config import get_settings
from shared.data_filter import filter_sensitive_data
from shared.errors import ErrorCode, AppException
from .circuit_breaker import CircuitBreaker


class LLMRouter:
    """LLM 路由器：模型选择、降级切换、实际调用。"""

    # 降级链（mock 为兜底，确保 demo 无 LLM 也能跑通）
    # deepseek 优先级最高：用户已配置外部 API
    FALLBACK_CHAIN = ["deepseek", "ollama", "anthropic", "openai", "mock"]

    def __init__(self, db=None, user_id: str | None = None):
        """初始化 LLM 路由器。

        Args:
            db: 数据库会话（用于从 secrets 表读取加密的 API Key）
            user_id: 当前用户 ID（用于查询用户的 API Key）
        """
        self.settings = get_settings()
        self.db = db
        self.user_id = user_id
        self.breakers: dict[str, CircuitBreaker] = {
            provider: CircuitBreaker(
                max_failures=self.settings.llm_circuit_breaker_max_failures,
                retry_after_seconds=self.settings.llm_circuit_breaker_retry_minutes * 60,
            )
            for provider in self.FALLBACK_CHAIN
        }

    async def call(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
        provider: str = "ollama",
        temperature: float = 0.7,
        max_tokens: int = 32000,
        output_format: str | None = None,
    ) -> dict:
        """调用 LLM，自动降级切换。

        Returns:
            dict: {"content": str, "model": str, "provider": str, "tokens": {"input": int, "output": int}}
        """
        # 过滤敏感数据
        safe_system = filter_sensitive_data(system_prompt)
        safe_user = filter_sensitive_data(user_message)

        # 尝试调用
        providers_to_try = [provider] + [p for p in self.FALLBACK_CHAIN if p != provider]
        last_error = None

        for p in providers_to_try:
            breaker = self.breakers[p]
            try:
                breaker.check_and_raise(p)
                result = await self._call_provider(
                    p, safe_system, safe_user, model, temperature, max_tokens, output_format
                )
                breaker.record_success()
                return result
            except AppException as e:
                # LLM_ERROR（熔断/无 Key/调用失败）降级到下一个 provider；
                # 其他业务错误（如 VALIDATION_ERROR）直接抛出
                if e.code == ErrorCode.LLM_ERROR:
                    last_error = str(e)
                    breaker.record_failure()
                    continue
                raise
            except Exception as e:
                last_error = str(e)
                breaker.record_failure()
                continue

        raise AppException(ErrorCode.LLM_ERROR, f"所有 LLM 提供商调用失败: {last_error}", status_code=502)

    async def _call_provider(
        self, provider: str, system_prompt: str, user_message: str,
        model: str | None, temperature: float, max_tokens: int, output_format: str | None,
    ) -> dict:
        """调用具体提供商。"""
        if provider == "deepseek":
            return await self._call_deepseek(system_prompt, user_message, model, temperature, max_tokens, output_format)
        elif provider == "ollama":
            return await self._call_ollama(system_prompt, user_message, model, temperature, max_tokens, output_format)
        elif provider == "anthropic":
            return await self._call_anthropic(system_prompt, user_message, model, temperature, max_tokens, output_format)
        elif provider == "openai":
            return await self._call_openai(system_prompt, user_message, model, temperature, max_tokens, output_format)
        elif provider == "mock":
            return await self._call_mock(system_prompt, user_message, model, temperature, max_tokens, output_format)
        else:
            raise AppException(ErrorCode.VALIDATION_ERROR, f"未知的 LLM 提供商: {provider}", status_code=400)

    async def _get_api_key(self, key_name: str) -> str:
        """从数据库或环境变量获取 API Key。

        优先从数据库 secrets 表读取（前端配置），其次从环境变量。
        """
        # 1. 尝试从数据库读取
        if self.db and self.user_id:
            try:
                from sqlalchemy import text
                result = await self.db.execute(
                    text("""SELECT encrypted_value FROM secrets
                            WHERE user_id = :user_id AND key_name = :key_name AND deleted_at IS NULL
                            ORDER BY created_at DESC LIMIT 1"""),
                    {"user_id": self.user_id, "key_name": key_name}
                )
                row = result.fetchone()
                if row:
                    from m1_auth_security.security import decrypt_api_key
                    return decrypt_api_key(row.encrypted_value)
            except Exception:
                pass  # 数据库读取失败，回退到环境变量

        # 2. 从环境变量读取
        import os
        env_map = {
            "deepseek": "DEEPSEEK_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "openai": "OPENAI_API_KEY",
        }
        env_var = env_map.get(key_name, key_name.upper() + "_API_KEY")
        return os.environ.get(env_var, "")

    async def _call_deepseek(self, system_prompt: str, user_message: str, model: str | None, temperature: float, max_tokens: int, output_format: str | None) -> dict:
        """调用 DeepSeek API（OpenAI 兼容格式）。"""
        api_key = await self._get_api_key("deepseek")
        if not api_key:
            raise AppException(ErrorCode.LLM_ERROR, "未配置 DeepSeek API Key", status_code=502)

        model_name = model or "deepseek-chat"
        url = "https://api.deepseek.com/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        system_block = system_prompt
        if output_format:
            system_block += f"\n\n请以以下 JSON 格式输出：\n{output_format}"

        msgs = [
            {"role": "system", "content": system_block},
            {"role": "user", "content": user_message},
        ]

        payload = {
            "model": model_name,
            "messages": msgs,
            "temperature": temperature,
            "max_tokens": min(max_tokens, 8192),  # DeepSeek 限制
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return {
            "content": content,
            "model": model_name,
            "provider": "deepseek",
            "tokens": {
                "input": usage.get("prompt_tokens", 0),
                "output": usage.get("completion_tokens", 0),
            },
        }

    async def _call_ollama(self, system_prompt: str, user_message: str, model: str | None, temperature: float, max_tokens: int, output_format: str | None) -> dict:
        """调用 Ollama REST API。"""
        model_name = model or self.settings.ollama_default_model
        url = f"{self.settings.ollama_base_url}/api/generate"

        messages = f"{system_prompt}\n\n用户任务：{user_message}"

        payload = {
            "model": model_name,
            "prompt": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("response", "")
        return {
            "content": content,
            "model": model_name,
            "provider": "ollama",
            "tokens": {
                "input": data.get("prompt_eval_count", 0),
                "output": data.get("eval_count", 0),
            },
        }

    async def _call_anthropic(self, system_prompt: str, user_message: str, model: str | None, temperature: float, max_tokens: int, output_format: str | None) -> dict:
        """调用 Anthropic API（需要 API Key）。"""
        api_key = await self._get_api_key("anthropic")
        if not api_key:
            raise AppException(ErrorCode.LLM_ERROR, "未配置 Anthropic API Key", status_code=502)

        model_name = model or "claude-sonnet-4-5"
        url = "https://api.anthropic.com/v1/messages"

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        system_prompt_block = system_prompt
        if output_format:
            system_prompt_block += f"\n\n请以以下 JSON 格式输出：\n{output_format}"

        payload = {
            "model": model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt_block,
            "messages": [{"role": "user", "content": user_message}],
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        content = data["content"][0]["text"]
        return {
            "content": content,
            "model": model_name,
            "provider": "anthropic",
            "tokens": {
                "input": data["usage"]["input_tokens"],
                "output": data["usage"]["output_tokens"],
            },
        }

    async def _call_openai(self, system_prompt: str, user_message: str, model: str | None, temperature: float, max_tokens: int, output_format: str | None) -> dict:
        """调用 OpenAI API（需要 API Key）。"""
        api_key = await self._get_api_key("openai")
        if not api_key:
            raise AppException(ErrorCode.LLM_ERROR, "未配置 OpenAI API Key", status_code=502)

        model_name = model or "gpt-4o"
        url = "https://api.openai.com/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        msgs = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        payload = {
            "model": model_name,
            "messages": msgs,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        return {
            "content": content,
            "model": model_name,
            "provider": "openai",
            "tokens": {
                "input": data["usage"]["prompt_tokens"],
                "output": data["usage"]["completion_tokens"],
            },
        }

    async def _call_mock(
        self, system_prompt: str, user_message: str, model: str | None,
        temperature: float, max_tokens: int, output_format: str | None,
    ) -> dict:
        """Mock 兜底 provider：无 LLM 时生成结构化中文内容，确保 demo 可跑通。

        根据 system_prompt 中的角色关键词和 user_message 中的活动关键词，
        生成与 Agent 角色匹配的、有意义的中文输出。
        """
        # 识别 Agent 角色（优先使用注入的角色标记）
        sp = system_prompt
        import re
        role_match = re.search(r"<!-- AGENT_ROLE: (\w+) -->", sp)
        agent_role = role_match.group(1) if role_match else ""

        if agent_role == "product_manager":
            role_label, role_intro = "产品经理", "需求分析与产品规划"
        elif agent_role == "rd":
            role_label, role_intro = "研发架构师", "技术架构与系统设计"
        elif agent_role == "qa":
            role_label, role_intro = "测试专家", "质量保障与测试策略"
        elif agent_role == "marketing":
            role_label, role_intro = "市场专家", "市场调研与竞品分析"
        elif agent_role == "manufacturing":
            role_label, role_intro = "制造工程师", "可制造性设计与供应链"
        elif agent_role == "finance":
            role_label, role_intro = "财务分析师", "商业论证与成本核算"
        elif "产品经理" in sp:
            role_label, role_intro = "产品经理", "需求分析与产品规划"
        elif "研发架构师" in sp:
            role_label, role_intro = "研发架构师", "技术架构与系统设计"
        elif "市场" in sp:
            role_label, role_intro = "市场专家", "市场调研与竞品分析"
        elif "财务" in sp:
            role_label, role_intro = "财务分析师", "商业论证与成本核算"
        else:
            role_label, role_intro = "Agent", "综合分析"

        # 识别活动类型（基于 user_message 内容）
        um = user_message or ""
        activity_section = self._detect_activity_section(um)

        # 生成结构化内容
        content = self._build_mock_content(role_label, role_intro, activity_section, um)

        # 模拟 token 计数
        input_tokens = len(system_prompt) // 4 + len(user_message) // 4
        output_tokens = len(content) // 4

        return {
            "content": content,
            "model": "mock-demo",
            "provider": "mock",
            "tokens": {"input": input_tokens, "output": output_tokens},
        }

    @staticmethod
    def _detect_activity_section(user_message: str) -> str:
        """根据消息内容识别活动类型，返回对应章节标题。"""
        msg = user_message or ""
        msg_lower = msg.lower()
        # 优先匹配 activity_key 格式 [活动: xxx]
        if "customer_needs" in msg:
            return "客户需求调研"
        if "competitive_analysis" in msg:
            return "竞品分析"
        if "business_case" in msg:
            return "商业论证"
        if "mrd_draft" in msg or "mrd" in msg_lower:
            return "MRD 撰写"
        if "prd_draft" in msg or "prd" in msg_lower:
            return "PRD 撰写"
        if "tech_eval" in msg or "技术" in msg or "架构" in msg:
            return "技术评估"
        if "test_strategy" in msg or "测试" in msg or "用例" in msg:
            return "测试策略"
        if "gtm" in msg_lower or "上市" in msg or "发布" in msg:
            return "GTM 计划"
        if "bom" in msg_lower or "成本" in msg or "供应链" in msg:
            return "BOM 与供应链"
        if "roi" in msg_lower or "投资" in msg or "财务" in msg:
            return "ROI 预测"
        if "竞品" in msg:
            return "竞品分析"
        if "商业" in msg:
            return "商业论证"
        return "综合分析"

    @staticmethod
    def _build_mock_content(role: str, role_intro: str, section: str, user_input: str) -> str:
        """构建 mock 输出内容（Markdown 格式）。"""
        # 根据角色 + 活动生成针对性内容
        role_specifics = {
            "产品经理": [
                "目标用户画像已初步明确，核心痛点集中在效率提升与成本控制",
                "建议优先级排序：P0 核心功能 3 项，P1 增强功能 5 项，P2 可延后",
                "验收标准应量化：用户完成核心任务时长 ≤ 30 秒，错误率 ≤ 2%",
            ],
            "研发架构师": [
                "推荐技术栈：前端 React + 后端 FastAPI，数据库 PostgreSQL",
                "架构关键决策：采用微服务拆分，核心服务独立部署，保证可扩展性",
                "技术风险：第三方 API 依赖需评估 SLA，建议设计降级方案",
            ],
            "测试专家": [
                "测试策略：单元测试覆盖率 ≥ 80%，集成测试覆盖核心流程，E2E 覆盖关键路径",
                "建议测试金字塔：单元 70% / 集成 20% / E2E 10%",
                "质量门禁：P0/P1 缺陷必须清零方可进入下一阶段",
            ],
            "市场专家": [
                "目标市场规模估算：TAM 50 亿，SAM 12 亿，SOM 1.5 亿（3 年内）",
                "主要竞品 3 家，差异化机会在于垂直行业深度定制与性价比",
                "GTM 建议：先 B 端标杆客户验证，再规模化推广",
            ],
            "制造工程师": [
                "BOM 初估：核心物料 23 项，预计单台物料成本控制在目标价 60% 以内",
                "DFM 建议：减少非标准件种类，提升 SMT 贴片效率",
                "供应链风险：关键芯片需双供应商策略，备货周期建议 8 周",
            ],
            "财务分析师": [
                "成本结构：研发投入占比 35%，制造成本 40%，运营 15%，市场 10%",
                "ROI 预测：预计 18 个月达到盈亏平衡，3 年 IRR 约 28%",
                "敏感性分析：售价 ±10% 对 IRR 影响约 ±8 个百分点",
            ],
        }
        points = role_specifics.get(role, [
            "已基于上下文完成分析",
            "建议进入下一阶段前完成评审",
            "关键风险已识别并给出应对建议",
        ])

        lines = [
            f"## {role} — {section}",
            "",
            f"**角色定位**：{role_intro}",
            "",
            "**关键产出**：",
        ]
        for i, p in enumerate(points, 1):
            lines.append(f"{i}. {p}")
        lines.extend([
            "",
            "**下一步建议**：",
            f"- 完成当前产出物的评审与确认",
            f"- 协同其他 Agent 角色进行交叉验证",
            f"- 准备门禁评审所需材料",
            "",
            f"> 本内容由 demo mock 生成（未连接 LLM）。配置 Ollama 或 API Key 后将获得真实 AI 输出。",
        ])
        return "\n".join(lines)

    async def test_connection(self, provider: str, model: str | None = None) -> dict:
        """测试模型连接。"""
        start_time = time.time()
        try:
            result = await self.call(
                system_prompt="你是一个帮助测试的助手。",
                user_message="请回复 'OK' 表示连接正常。",
                model=model,
                provider=provider,
                max_tokens=50,
            )
            latency = round((time.time() - start_time) * 1000)
            return {
                "success": True,
                "model": result["model"],
                "provider": result["provider"],
                "latency_ms": latency,
                "tokens": result["tokens"],
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }