"""M4 Agent 编排测试。"""
import pytest
from ..deadlock_detector import DeadlockDetector, calculate_similarity
from ..language_detector import is_chinese, check_language
from ..output_parser import parse_json_output
from ..reasoning_summarizer import generate_reasoning_summary
from ..circuit_breaker import CircuitBreaker, CircuitState


def test_calculate_similarity():
    """测试文本相似度计算。"""
    sim = calculate_similarity("你好世界", "你好世界")
    assert sim > 0.8

    sim2 = calculate_similarity("你好世界", "完全不同")
    assert sim2 < 0.5


def test_deadlock_detector():
    """测试死循环检测。"""
    detector = DeadlockDetector(threshold=0.85, max_rounds_no_new_ideas=3)

    # 添加相同文本 3 次
    detector.add_round("这是一个测试文本，内容完全相同。")
    detector.add_round("这是一个测试文本，内容完全相同。")
    result = detector.add_round("这是一个测试文本，内容完全相同。")
    assert result is True  # 应该检测到死循环


def test_language_detection():
    """测试语言检测。"""
    assert is_chinese("这是中文文本。") is True
    assert is_chinese("This is English text.") is False


def test_json_parsing():
    """测试 JSON 解析。"""
    result = parse_json_output('{"key": "value"}')
    assert result["parsed"] is True
    assert result["content"]["key"] == "value"

    # 代码块
    result2 = parse_json_output('```json\n{"key": "value"}\n```')
    assert result2["parsed"] is True

    # 纯文本降级
    result3 = parse_json_output("这是纯文本")
    assert result3["parsed"] is False


def test_reasoning_summary():
    """测试推理摘要生成。"""
    outputs = [
        {"role": "product_manager", "content": "根据市场分析，该产品有较大潜力。建议定价在100-150元之间。"},
        {"role": "rd", "content": "技术方案可行，建议使用微服务架构。"},
    ]
    summary = generate_reasoning_summary(outputs)
    assert "product_manager" in summary
    assert "rd" in summary


def test_circuit_breaker():
    """测试熔断器。"""
    breaker = CircuitBreaker(max_failures=3, retry_after_seconds=600)

    assert breaker.state == CircuitState.CLOSED
    assert breaker.can_call() is True

    breaker.record_failure()
    breaker.record_failure()
    breaker.record_failure()

    assert breaker.state == CircuitState.OPEN
    assert breaker.can_call() is False

    breaker.record_success()
    # 注意：OPEN 状态下 record_success 不会改变状态


def test_check_language():
    """测试语言检查。"""
    is_cn, reason = check_language("这是中文")
    assert is_cn is True
    assert reason == ""

    is_cn2, reason2 = check_language("This is English")
    assert is_cn2 is False
    assert reason2 != ""