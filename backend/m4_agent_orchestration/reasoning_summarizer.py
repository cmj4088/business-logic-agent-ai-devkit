"""推理摘要生成 — M4 Agent 编排。

生成 Agent 推理过程的中文摘要。
"""
import re


def generate_reasoning_summary(agent_outputs: list[dict], max_length: int = 200) -> str:
    """生成 Agent 推理过程的中文摘要。

    Args:
        agent_outputs: Agent 输出列表 [{"role": "product_manager", "content": "..."}]
        max_length: 摘要最大长度。

    Returns:
        中文摘要字符串。
    """
    if not agent_outputs:
        return "无推理过程"

    summaries = []
    for output in agent_outputs:
        role = output.get("role", "未知")
        content = output.get("content", "")

        # 提取关键句（前 2 句）
        sentences = re.split(r'[。！？\n]', content)
        key_sentences = [s.strip() for s in sentences if len(s.strip()) > 10][:2]

        if key_sentences:
            summary = f"{role}：{'。'.join(key_sentences)}"
            summaries.append(summary)

    result = "；".join(summaries)

    if len(result) > max_length:
        result = result[:max_length - 3] + "..."

    return result if result else "推理过程已生成"