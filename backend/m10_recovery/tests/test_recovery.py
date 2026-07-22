"""M10 异常恢复模块测试。"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from ..recovery_manager import (
    RecoveryManager,
    _generate_id,
    ACTION_TYPES,
    DEADLOCK_RESOLUTIONS,
)
from ..models import (
    RecoveryActionRequest,
    DebateResolveRequest,
    RegenerateRequest,
    ProceedWithIssuesRequest,
    RecoveryStatusResponse,
)
from shared.errors import AppException, ErrorCode


# ========================================================================
# 模型测试
# ========================================================================


class TestRecoveryModels:
    """Pydantic 请求模型测试。"""

    def test_recovery_action_request_valid(self):
        """测试恢复动作请求模型：有效输入。"""
        req = RecoveryActionRequest(
            action_type="regenerate_artifact",
            params={"artifact_id": "art_abc123", "temperature": 0.9},
        )
        assert req.action_type == "regenerate_artifact"
        assert req.params["artifact_id"] == "art_abc123"

    def test_recovery_action_request_defaults(self):
        """测试恢复动作请求模型：默认值。"""
        req = RecoveryActionRequest(action_type="switch_model")
        assert req.params == {}

    def test_debate_resolve_request_valid(self):
        """测试辩论死锁裁决请求模型：有效输入。"""
        req = DebateResolveRequest(
            round_id="round_abc123",
            resolution="moderator_decide",
        )
        assert req.round_id == "round_abc123"
        assert req.resolution == "moderator_decide"

    def test_regenerate_request_defaults(self):
        """测试重新生成请求模型：默认值。"""
        req = RegenerateRequest(artifact_id="art_test")
        assert req.temperature == 0.9
        assert req.model == "ollama"

    def test_regenerate_request_temperature_bounds(self):
        """测试重新生成请求模型：温度边界。"""
        req = RegenerateRequest(artifact_id="art_test", temperature=0.0)
        assert req.temperature == 0.0

        req = RegenerateRequest(artifact_id="art_test", temperature=2.0)
        assert req.temperature == 2.0

    def test_proceed_with_issues_request_valid(self):
        """测试带着遗留问题前进请求模型：有效输入。"""
        req = ProceedWithIssuesRequest(
            project_id="proj_test",
            gate_id="gate_001",
            reason="已知风险，决策继续推进",
            accepted_issue_ids=["issue_001", "issue_002"],
        )
        assert req.project_id == "proj_test"
        assert req.gate_id == "gate_001"
        assert len(req.accepted_issue_ids) == 2

    def test_recovery_status_response(self):
        """测试恢复状态响应模型。"""
        resp = RecoveryStatusResponse(
            project_id="proj_test",
            status="正常",
            active_actions=[],
            recent_actions=[],
            summary={"total_actions": 0},
        )
        assert resp.status == "正常"
        assert resp.summary["total_actions"] == 0


# ========================================================================
# 辅助函数
# ========================================================================


def _make_result(rows=None, one=None):
    """创建模拟的 SQLAlchemy Result 对象。

    SQLAlchemy 的 CursorResult.fetchall() 和 fetchone() 是同步方法，
    因此使用 MagicMock 而非 AsyncMock。
    """
    result = MagicMock()
    result.fetchall.return_value = rows or []
    result.fetchone.return_value = one
    return result


# ========================================================================
# RecoveryManager 单元测试
# ========================================================================


class TestRecoveryManager:
    """RecoveryManager 业务逻辑测试。"""

    @pytest.fixture
    def mock_db(self):
        """创建模拟数据库会话。"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def manager(self, mock_db):
        """创建 RecoveryManager 实例。"""
        return RecoveryManager(mock_db)

    @pytest.mark.asyncio
    async def test_get_recovery_status_normal(self, manager, mock_db):
        """测试恢复状态查询：正常状态（无恢复动作）。"""
        # 模拟空结果 — 使用 MagicMock 因为 fetchall/fetchone 是同步方法
        mock_db.execute.return_value = _make_result(rows=[])

        result = await manager.get_recovery_status("proj_test")

        assert result["project_id"] == "proj_test"
        assert result["status"] == "正常"
        assert result["active_actions"] == []
        assert result["recent_actions"] == []

    @pytest.mark.asyncio
    async def test_get_recovery_status_with_active_actions(self, manager, mock_db):
        """测试恢复状态查询：有进行中的恢复动作。"""
        active_rows = [
            ("rec_001", "regenerate_artifact", "{}", "in_progress", "2024-01-01")
        ]
        recent_rows = [
            ("rec_001", "regenerate_artifact", "{}", "completed", "{}", "2024-01-01")
        ]
        count_rows = [("regenerate_artifact", 1)]

        mock_db.execute.side_effect = [
            _make_result(rows=active_rows),   # active_actions 查询
            _make_result(rows=recent_rows),   # recent_actions 查询
            _make_result(rows=count_rows),    # action_counts 查询
            _make_result(one=(0,)),           # gate_failures 查询
        ]

        result = await manager.get_recovery_status("proj_test")

        assert result["status"] == "恢复中"
        assert len(result["active_actions"]) == 1
        assert result["active_actions"][0]["action_type"] == "regenerate_artifact"

    @pytest.mark.asyncio
    async def test_execute_action_invalid_type(self, manager, mock_db):
        """测试执行恢复动作：无效的动作类型。"""
        with pytest.raises(AppException) as exc_info:
            await manager.execute_action(
                "proj_test", "invalid_action", {"project_id": "proj_test"}
            )

        assert exc_info.value.code == ErrorCode.VALIDATION_ERROR
        assert "不支持的恢复动作类型" in str(exc_info.value.message)

    @pytest.mark.asyncio
    async def test_execute_action_regenerate_missing_artifact_id(self, manager, mock_db):
        """测试执行恢复动作：重新生成缺少 artifact_id。"""
        mock_db.execute.return_value = MagicMock()

        with pytest.raises(AppException) as exc_info:
            await manager.execute_action(
                "proj_test",
                "regenerate_artifact",
                {"project_id": "proj_test"},
            )

        assert exc_info.value.code == ErrorCode.VALIDATION_ERROR
        assert "artifact_id" in str(exc_info.value.message)

    def test_resolve_debate_deadlock_invalid_resolution(self):
        """测试辩论死锁裁决：无效的裁决方式。"""
        manager = RecoveryManager(AsyncMock(spec=AsyncSession))

        with pytest.raises(AppException) as exc_info:
            asyncio.run(
                manager.resolve_debate_deadlock("round_test", "invalid_resolution")
            )

        assert exc_info.value.code == ErrorCode.VALIDATION_ERROR
        assert "不支持的裁决方式" in str(exc_info.value.message)

    def test_action_types_completeness(self):
        """测试恢复动作类型完整性。"""
        expected_types = {
            "regenerate_artifact",
            "resolve_deadlock",
            "switch_model",
            "proceed_with_issues",
            "retry_stage",
            "rollback_stage",
            "manual_intervention",
        }
        assert set(ACTION_TYPES.keys()) == expected_types

    def test_deadlock_resolutions_completeness(self):
        """测试死锁裁决方式完整性。"""
        expected_resolutions = {"moderator_decide", "restart", "proceed"}
        assert set(DEADLOCK_RESOLUTIONS.keys()) == expected_resolutions

    def test_generate_id(self):
        """测试 ID 生成。"""
        id1 = _generate_id("recovery_")
        id2 = _generate_id("recovery_")

        assert id1.startswith("recovery_")
        assert id2.startswith("recovery_")
        assert id1 != id2
        assert len(id1) == len("recovery_") + 12

    @pytest.mark.asyncio
    async def test_regenerate_artifact_not_found(self, manager, mock_db):
        """测试重新生成产出物：产出物不存在。"""
        mock_db.execute.return_value = _make_result(one=None)

        with pytest.raises(AppException) as exc_info:
            await manager.regenerate_artifact("nonexistent_art")

        assert exc_info.value.code == ErrorCode.NOT_FOUND
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_proceed_with_issues_empty_reason(self, manager, mock_db):
        """测试带着遗留问题前进：空理由也允许。"""
        mock_db.execute.return_value = _make_result(rows=[
            ("issue_001", "性能问题", "open"),
            ("issue_002", "安全问题", "open"),
        ])

        result = await manager.proceed_with_issues(
            project_id="proj_test",
            gate_id="gate_001",
            accepted_issue_ids=[],
            reason="",
        )

        assert result["accepted_issues"] == 2
        assert result["issue_ids"] == ["issue_001", "issue_002"]

    @pytest.mark.asyncio
    async def test_proceed_with_issues_no_open_issues(self, manager, mock_db):
        """测试带着遗留问题前进：没有待处理的问题。"""
        mock_db.execute.return_value = _make_result(rows=[])

        with pytest.raises(AppException) as exc_info:
            await manager.proceed_with_issues(
                project_id="proj_test",
                gate_id="gate_001",
            )

        assert exc_info.value.code == ErrorCode.NOT_FOUND
        assert "没有待处理的问题" in str(exc_info.value.message)

    def test_resolve_deadlock_moderator_decide(self):
        """测试辩论死锁：主持人裁决返回正确结构。"""
        manager = RecoveryManager(AsyncMock(spec=AsyncSession))

        async def run_test():
            result = await manager._handle_resolve_deadlock(
                "round_test", "moderator_decide"
            )
            assert result["resolution"] == "moderator_decide"
            assert result["round_id"] == "round_test"
            assert result["action"] == "主持人已做出裁决，辩论结束"

        asyncio.run(run_test())

    def test_resolve_deadlock_restart(self):
        """测试辩论死锁：重新开始返回正确结构。"""
        manager = RecoveryManager(AsyncMock(spec=AsyncSession))

        async def run_test():
            result = await manager._handle_resolve_deadlock("round_test", "restart")
            assert result["resolution"] == "restart"
            assert "new_round_id" in result
            assert result["action"] == "辩论已重新开始，使用更高温度参数"

        asyncio.run(run_test())

    def test_resolve_deadlock_proceed(self):
        """测试辩论死锁：忽略继续返回正确结构。"""
        manager = RecoveryManager(AsyncMock(spec=AsyncSession))

        async def run_test():
            result = await manager._handle_resolve_deadlock("round_test", "proceed")
            assert result["resolution"] == "proceed"
            assert result["action"] == "已记录分歧点，忽略死锁继续推进"

        asyncio.run(run_test())

    def test_handle_switch_model_default_chain(self):
        """测试 LLM 模型切换：默认降级链。"""
        manager = RecoveryManager(AsyncMock(spec=AsyncSession))

        async def run_test():
            result = await manager._handle_switch_model(
                "proj_test", {"current_model": "ollama"}
            )
            assert result["fallback_chain"] == ["anthropic", "openai"]

            result2 = await manager._handle_switch_model(
                "proj_test", {"current_model": "anthropic"}
            )
            assert result2["fallback_chain"] == ["openai", "ollama"]

            result3 = await manager._handle_switch_model(
                "proj_test", {"current_model": "openai"}
            )
            assert result3["fallback_chain"] == ["ollama", "anthropic"]

        asyncio.run(run_test())