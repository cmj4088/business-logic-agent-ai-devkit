"""产出物管理核心服务 — M5。

负责产出物的创建、查询、更新、删除和版本管理。
"""
import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import ErrorCode, AppException


def generate_artifact_id() -> str:
    """生成产出物 ID。"""
    return f"art_{uuid.uuid4().hex[:12]}"


def generate_version_id() -> str:
    """生成版本 ID。"""
    return f"ver_{uuid.uuid4().hex[:12]}"


class ArtifactService:
    """产出物管理服务。"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_artifact(
        self,
        project_id: str,
        artifact_type: str,
        name: str,
        content: str,
        stage: str,
        ai_metadata: dict | None = None,
    ) -> dict:
        """创建产出物（初始版本为 1）。"""
        artifact_id = generate_artifact_id()
        version_id = generate_version_id()
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        metadata_json = json.dumps(ai_metadata or {}, ensure_ascii=False)

        # 插入产出物记录
        await self.db.execute(
            text("""INSERT INTO artifacts (id, project_id, artifact_type, name, content,
                    version, stage, ai_metadata, created_at, updated_at)
                    VALUES (:id, :project_id, :artifact_type, :name, :content,
                    :version, :stage, :ai_metadata, :created_at, :updated_at)"""),
            {
                "id": artifact_id,
                "project_id": project_id,
                "artifact_type": artifact_type,
                "name": name,
                "content": content,
                "version": 1,
                "stage": stage,
                "ai_metadata": metadata_json,
                "created_at": now,
                "updated_at": now,
            }
        )

        # 插入初始版本记录
        await self.db.execute(
            text("""INSERT INTO artifact_versions (id, artifact_id, version, content, created_at)
                    VALUES (:id, :artifact_id, :version, :content, :created_at)"""),
            {
                "id": version_id,
                "artifact_id": artifact_id,
                "version": 1,
                "content": content,
                "created_at": now,
            }
        )

        await self.db.commit()
        return await self.get_artifact(artifact_id)

    async def get_artifact(self, artifact_id: str) -> dict:
        """获取产出物详情（不含已删除）。"""
        result = await self.db.execute(
            text("SELECT * FROM artifacts WHERE id = :id AND deleted_at IS NULL"),
            {"id": artifact_id}
        )
        row = result.fetchone()
        if row is None:
            raise AppException(ErrorCode.NOT_FOUND, "产出物不存在", status_code=404)

        return self._row_to_dict(row)

    async def list_artifacts(
        self,
        project_id: str,
        stage: str | None = None,
        artifact_type: str | None = None,
    ) -> list[dict]:
        """按项目、阶段和类型筛选产出物列表。"""
        query = "SELECT * FROM artifacts WHERE project_id = :project_id AND deleted_at IS NULL"
        params: dict = {"project_id": project_id}

        if stage:
            query += " AND stage = :stage"
            params["stage"] = stage

        if artifact_type:
            query += " AND artifact_type = :artifact_type"
            params["artifact_type"] = artifact_type

        query += " ORDER BY created_at DESC"

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()
        return [self._row_to_dict(row) for row in rows]

    async def update_artifact(
        self,
        artifact_id: str,
        content: str,
        change_summary: str = "",
    ) -> dict:
        """更新产出物内容（创建新版本）。"""
        # 获取当前产出物
        current = await self.get_artifact(artifact_id)
        new_version = current["version"] + 1
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # 更新主记录
        await self.db.execute(
            text("""UPDATE artifacts SET content = :content, version = :version,
                    updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL"""),
            {
                "id": artifact_id,
                "content": content,
                "version": new_version,
                "updated_at": now,
            }
        )

        # 插入新版本记录
        version_id = generate_version_id()
        await self.db.execute(
            text("""INSERT INTO artifact_versions (id, artifact_id, version, content, created_at)
                    VALUES (:id, :artifact_id, :version, :content, :created_at)"""),
            {
                "id": version_id,
                "artifact_id": artifact_id,
                "version": new_version,
                "content": content,
                "created_at": now,
            }
        )

        await self.db.commit()
        return await self.get_artifact(artifact_id)

    async def delete_artifact(self, artifact_id: str) -> None:
        """软删除产出物。"""
        # 确认产出物存在
        await self.get_artifact(artifact_id)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await self.db.execute(
            text("""UPDATE artifacts SET deleted_at = :deleted_at, updated_at = :updated_at
                    WHERE id = :id AND deleted_at IS NULL"""),
            {
                "id": artifact_id,
                "deleted_at": now,
                "updated_at": now,
            }
        )
        await self.db.commit()

    async def get_versions(self, artifact_id: str) -> list[dict]:
        """获取产出物的所有版本历史。"""
        # 确认产出物存在
        await self.get_artifact(artifact_id)

        result = await self.db.execute(
            text("""SELECT id, artifact_id, version, content, created_at
                    FROM artifact_versions
                    WHERE artifact_id = :artifact_id
                    ORDER BY version DESC"""),
            {"artifact_id": artifact_id}
        )
        rows = result.fetchall()
        return [
            {
                "id": row.id,
                "artifact_id": row.artifact_id,
                "version": row.version,
                "content": row.content,
                "created_at": row.created_at,
            }
            for row in rows
        ]

    async def get_version(self, artifact_id: str, version: int) -> dict:
        """获取产出物的特定版本。"""
        # 确认产出物存在
        await self.get_artifact(artifact_id)

        result = await self.db.execute(
            text("""SELECT id, artifact_id, version, content, created_at
                    FROM artifact_versions
                    WHERE artifact_id = :artifact_id AND version = :version"""),
            {"artifact_id": artifact_id, "version": version}
        )
        row = result.fetchone()
        if row is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"版本 {version} 不存在",
                status_code=404,
            )

        return {
            "id": row.id,
            "artifact_id": row.artifact_id,
            "version": row.version,
            "content": row.content,
            "created_at": row.created_at,
        }

    def _row_to_dict(self, row) -> dict:
        """将数据库行转换为字典。"""
        return {
            "id": row.id,
            "project_id": row.project_id,
            "artifact_type": row.artifact_type,
            "name": row.name,
            "content": row.content,
            "version": row.version,
            "stage": row.stage,
            "ai_metadata": row.ai_metadata,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }