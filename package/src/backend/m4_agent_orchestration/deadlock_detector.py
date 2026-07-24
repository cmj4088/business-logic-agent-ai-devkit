"""死循环检测 — M4 Agent 编排。

检测辩论模式中连续多轮无新观点的情况。
"""
import re


def calculate_similarity(text1: str, text2: str) -> float:
    """计算两段文本的简单语义相似度（基于词频 Jaccard 相似度）。

    Args:
        text1: 第一段文本。
        text2: 第二段文本。

    Returns:
        相似度分数（0.0 - 1.0）。
    """
    if not text1 or not text2:
        return 0.0

    # 分词（简单按空白字符和标点分割）
    def tokenize(text: str) -> set[str]:
        # 移除标点，转小写，按空白分割
        cleaned = re.sub(r'[^\w\s]', '', text.lower())
        # 提取 2-gram 字符序列（中文友好）
        words = set()
        for i in range(len(cleaned) - 1):
            words.add(cleaned[i:i+2])
        # 也加入单字
        words.update(cleaned)
        return words

    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)

    if not tokens1 or not tokens2:
        return 0.0

    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)

    return intersection / union if union > 0 else 0.0


class DeadlockDetector:
    """死循环检测器。

    检测连续 N 轮无新观点（语义相似度 > 阈值）。
    """

    def __init__(self, threshold: float = 0.85, max_rounds_no_new_ideas: int = 3):
        self.threshold = threshold
        self.max_rounds_no_new_ideas = max_rounds_no_new_ideas
        self.round_texts: list[str] = []

    def add_round(self, text: str) -> bool:
        """添加一轮输出，返回是否检测到死循环。

        Returns:
            True 表示检测到死循环，应终止辩论。
        """
        self.round_texts.append(text)

        if len(self.round_texts) < self.max_rounds_no_new_ideas:
            return False

        # 检查最近 N 轮是否高度相似
        recent = self.round_texts[-self.max_rounds_no_new_ideas:]
        for i in range(len(recent) - 1):
            for j in range(i + 1, len(recent)):
                sim = calculate_similarity(recent[i], recent[j])
                if sim < self.threshold:
                    return False

        return True

    def reset(self) -> None:
        """重置检测器状态。"""
        self.round_texts = []