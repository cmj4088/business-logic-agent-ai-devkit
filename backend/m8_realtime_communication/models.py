"""M8 实时通信数据模型。"""

from typing import Optional

from pydantic import BaseModel, Field


class WSMessage(BaseModel):
    """WebSocket 消息统一模型。

    Attributes:
        type: 消息类型（subscribe / unsubscribe / agent_token / stage_update /
              widget_update / notification / error / ping / pong）。
        channel: 目标通道名称，可选。
        project_id: 所属项目 ID，可选。
        data: 消息载荷，可选。
    """

    type: str = Field(..., description="消息类型")
    channel: Optional[str] = Field(None, description="目标通道名称")
    project_id: Optional[str] = Field(None, description="所属项目 ID")
    data: Optional[dict] = Field(None, description="消息载荷")