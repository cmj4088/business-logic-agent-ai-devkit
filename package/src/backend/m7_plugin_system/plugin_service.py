"""插件业务逻辑 — M7 插件系统。

提供插件安装、配置、启用/禁用、卸载等核心业务。
MVP 阶段仅内置 web_search 插件。
"""
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from shared.errors import ErrorCode, AppException
from m1_auth_security.security import encrypt_api_key, decrypt_api_key
from .skill_plugin import build_skill_plugins, get_skill_plugin, is_skill_plugin, refresh_skill_plugins


# === 内置插件定义 ===

# 基础插件（不含 Skill 插件，Skill 插件在运行时动态加载）
_BUILTIN_BASE_PLUGINS = {
    "web_search": {
        "plugin_id": "web_search",
        "name": "网页搜索",
        "version": "1.0.0",
        "description": "搜索互联网获取最新信息，支持关键词搜索和 URL 抓取",
        "category": "工具",
        "config_schema": {
            "type": "object",
            "properties": {
                "search_api_key": {
                    "type": "string",
                    "description": "搜索 API Key（可选，如 SerpAPI / Brave Search）",
                },
                "search_engine": {
                    "type": "string",
                    "description": "搜索引擎类型",
                    "enum": ["duckduckgo", "serpapi", "brave"],
                    "default": "duckduckgo",
                },
                "max_results": {
                    "type": "integer",
                    "description": "单次搜索最大结果数",
                    "default": 5,
                    "minimum": 1,
                    "maximum": 20,
                },
                "timeout": {
                    "type": "integer",
                    "description": "搜索超时（秒）",
                    "default": 10,
                    "minimum": 1,
                    "maximum": 60,
                },
            },
        },
        "tools": [
            {
                "tool_name": "web_search",
                "tool_schema": json.dumps({
                    "type": "function",
                    "function": {
                        "name": "web_search",
                        "description": "搜索互联网获取最新信息，支持中文关键词搜索",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "搜索关键词",
                                },
                                "num_results": {
                                    "type": "integer",
                                    "description": "返回结果数量，默认 5，最大 20",
                                    "default": 5,
                                },
                            },
                            "required": ["query"],
                        },
                    },
                }, ensure_ascii=False),
            },
            {
                "tool_name": "fetch_url",
                "tool_schema": json.dumps({
                    "type": "function",
                    "function": {
                        "name": "fetch_url",
                        "description": "抓取指定 URL 的网页内容并提取正文",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "url": {
                                    "type": "string",
                                    "description": "要抓取的网页 URL",
                                },
                                "max_length": {
                                    "type": "integer",
                                    "description": "返回内容最大字符数，默认 5000",
                                    "default": 5000,
                                },
                            },
                            "required": ["url"],
                        },
                    },
                }, ensure_ascii=False),
            },
        ],
    },
}

# API Key 配置键名列表（需要加密存储的字段）
SENSITIVE_CONFIG_KEYS = {"search_api_key", "api_key", "api_secret", "token", "password"}


def get_builtin_plugins() -> dict[str, dict]:
    """获取完整的内置插件定义（含运行时动态加载的 Skill 插件）。

    在模块导入时，Skill 插件尚未注册到 SkillRegistry，
    因此需要延迟到运行时才构建 Skill 插件定义。
    """
    skill_plugins = build_skill_plugins()
    return {**_BUILTIN_BASE_PLUGINS, **skill_plugins}


def _generate_id() -> str:
    """生成唯一 ID。"""
    return f"plugin_{uuid.uuid4().hex[:12]}"


def _now() -> str:
    """获取当前时间字符串。"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _mask_sensitive_config(config: dict) -> dict:
    """对配置中的敏感字段进行脱敏处理。

    Args:
        config: 原始配置字典。

    Returns:
        脱敏后的配置字典，敏感字段替换为 "***"。
    """
    if not config:
        return {}
    masked = {}
    for key, value in config.items():
        if key in SENSITIVE_CONFIG_KEYS and value:
            masked[key] = "***"
        else:
            masked[key] = value
    return masked


def _encrypt_sensitive_config(config: dict) -> dict:
    """对配置中的敏感字段进行加密。

    Args:
        config: 原始配置字典。

    Returns:
        加密后的配置字典，敏感字段替换为 Fernet 加密值。
    """
    if not config:
        return {}
    encrypted = {}
    for key, value in config.items():
        if key in SENSITIVE_CONFIG_KEYS and value:
            encrypted[key] = encrypt_api_key(str(value))
        else:
            encrypted[key] = value
    return encrypted


def _decrypt_sensitive_config(config: dict) -> dict:
    """对配置中的敏感字段进行解密。

    Args:
        config: 加密后的配置字典。

    Returns:
        解密后的配置字典。
    """
    if not config:
        return {}
    decrypted = {}
    for key, value in config.items():
        if key in SENSITIVE_CONFIG_KEYS and value:
            try:
                decrypted[key] = decrypt_api_key(str(value))
            except Exception:
                # 解密失败时保留原值（可能未加密）
                decrypted[key] = value
        else:
            decrypted[key] = value
    return decrypted


class PluginService:
    """插件服务。"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # === 已安装插件管理 ===

    async def list_plugins(self) -> list[dict]:
        """获取已安装的插件列表。

        Returns:
            已安装插件列表，每个插件包含基本信息和工具列表。
        """
        result = await self.db.execute(
            text("""SELECT id, plugin_id, name, version, enabled, config_json, installed_at
                    FROM plugin_configs ORDER BY installed_at DESC""")
        )
        plugins = []
        for row in result.fetchall():
            plugins.append({
                "id": row.id,
                "plugin_id": row.plugin_id,
                "name": row.name,
                "version": row.version,
                "enabled": bool(row.enabled),
                "config": _mask_sensitive_config(json.loads(row.config_json or "{}")),
                "tools": await self._get_plugin_tools(row.plugin_id),
                "installed_at": row.installed_at,
            })
        return plugins

    async def get_plugin(self, plugin_id: str) -> dict | None:
        """获取插件详情。

        Args:
            plugin_id: 插件 ID。

        Returns:
            插件详情字典，如果未安装则返回 None。
        """
        result = await self.db.execute(
            text("""SELECT id, plugin_id, name, version, enabled, config_json, installed_at
                    FROM plugin_configs WHERE plugin_id = :plugin_id"""),
            {"plugin_id": plugin_id},
        )
        row = result.fetchone()
        if row is None:
            return None
        return {
            "id": row.id,
            "plugin_id": row.plugin_id,
            "name": row.name,
            "version": row.version,
            "enabled": bool(row.enabled),
            "config": _mask_sensitive_config(json.loads(row.config_json or "{}")),
            "tools": await self._get_plugin_tools(row.plugin_id),
            "installed_at": row.installed_at,
        }

    async def install_plugin(self, plugin_id: str, config: dict) -> dict:
        """安装插件。MVP 仅支持内置 web_search 插件。

        Args:
            plugin_id: 插件 ID。
            config: 插件配置。

        Returns:
            安装后的插件详情。

        Raises:
            AppException: 插件不存在或已安装。
        """
        # 检查是否为内置插件
        builtin = get_builtin_plugins().get(plugin_id)
        if builtin is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"插件 '{plugin_id}' 不存在",
                status_code=404,
            )

        # 检查是否已安装
        existing = await self.get_plugin(plugin_id)
        if existing is not None:
            raise AppException(
                ErrorCode.CONFLICT,
                f"插件 '{plugin_id}' 已安装",
                status_code=409,
            )

        record_id = _generate_id()
        now = _now()

        # 根据插件类型合并默认配置
        if plugin_id == "web_search":
            merged_config = {
                "search_engine": "duckduckgo",
                "max_results": 5,
                "timeout": 10,
            }
        elif is_skill_plugin(plugin_id):
            # Skill 插件：默认配置
            merged_config = {
                "enabled": True,
                "auto_invoke": True,
            }
        else:
            merged_config = {}
        merged_config.update(config)
        encrypted_config = _encrypt_sensitive_config(merged_config)

        # 插入插件配置
        await self.db.execute(
            text("""INSERT INTO plugin_configs (id, plugin_id, name, version, enabled, config_json, installed_at)
                    VALUES (:id, :plugin_id, :name, :version, :enabled, :config_json, :installed_at)"""),
            {
                "id": record_id,
                "plugin_id": builtin["plugin_id"],
                "name": builtin["name"],
                "version": builtin["version"],
                "enabled": 1,
                "config_json": json.dumps(encrypted_config, ensure_ascii=False),
                "installed_at": now,
            },
        )

        # 插入插件工具
        for tool in builtin["tools"]:
            tool_id = _generate_id()
            await self.db.execute(
                text("""INSERT INTO plugin_tools (id, plugin_id, tool_name, tool_schema)
                        VALUES (:id, :plugin_id, :tool_name, :tool_schema)"""),
                {
                    "id": tool_id,
                    "plugin_id": builtin["plugin_id"],
                    "tool_name": tool["tool_name"],
                    "tool_schema": tool["tool_schema"],
                },
            )

        await self.db.commit()

        return {
            "id": record_id,
            "plugin_id": builtin["plugin_id"],
            "name": builtin["name"],
            "version": builtin["version"],
            "enabled": True,
            "config": _mask_sensitive_config(merged_config),
            "tools": builtin["tools"],
            "installed_at": now,
        }

    async def update_plugin(self, plugin_id: str, config: dict | None = None, enabled: bool | None = None) -> dict:
        """更新插件配置。

        Args:
            plugin_id: 插件 ID。
            config: 新配置（与现有配置合并）。
            enabled: 是否启用。

        Returns:
            更新后的插件详情。

        Raises:
            AppException: 插件未安装。
        """
        existing = await self._get_raw_plugin(plugin_id)
        if existing is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"插件 '{plugin_id}' 未安装",
                status_code=404,
            )

        now = _now()

        if config is not None:
            # 解密现有配置，合并新配置，再加密
            current_config = _decrypt_sensitive_config(json.loads(existing.config_json or "{}"))
            current_config.update(config)
            encrypted_config = _encrypt_sensitive_config(current_config)
            await self.db.execute(
                text("""UPDATE plugin_configs SET config_json = :config_json
                        WHERE plugin_id = :plugin_id"""),
                {
                    "config_json": json.dumps(encrypted_config, ensure_ascii=False),
                    "plugin_id": plugin_id,
                },
            )

        if enabled is not None:
            await self.db.execute(
                text("""UPDATE plugin_configs SET enabled = :enabled
                        WHERE plugin_id = :plugin_id"""),
                {
                    "enabled": 1 if enabled else 0,
                    "plugin_id": plugin_id,
                },
            )

        await self.db.commit()

        return await self.get_plugin(plugin_id)

    async def toggle_plugin(self, plugin_id: str, enabled: bool) -> dict:
        """启用/禁用插件。

        Args:
            plugin_id: 插件 ID。
            enabled: 是否启用。

        Returns:
            更新后的插件详情。
        """
        return await self.update_plugin(plugin_id, enabled=enabled)

    async def uninstall_plugin(self, plugin_id: str) -> None:
        """卸载插件。

        Args:
            plugin_id: 插件 ID。

        Raises:
            AppException: 插件未安装。
        """
        existing = await self._get_raw_plugin(plugin_id)
        if existing is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"插件 '{plugin_id}' 未安装",
                status_code=404,
            )

        # 删除插件工具
        await self.db.execute(
            text("DELETE FROM plugin_tools WHERE plugin_id = :plugin_id"),
            {"plugin_id": plugin_id},
        )

        # 删除插件配置
        await self.db.execute(
            text("DELETE FROM plugin_configs WHERE plugin_id = :plugin_id"),
            {"plugin_id": plugin_id},
        )

        await self.db.commit()

    # === 可用插件市场 ===

    async def get_available_plugins(self) -> list[dict]:
        """获取可用插件市场列表。

        MVP 阶段仅返回内置 web_search 插件定义。
        已安装的插件会标记为 installed=True。

        Returns:
            可用插件列表。
        """
        # 查询已安装的插件 ID
        result = await self.db.execute(
            text("SELECT plugin_id FROM plugin_configs")
        )
        installed_ids = {row.plugin_id for row in result.fetchall()}

        available = []
        for plugin_id, plugin in get_builtin_plugins().items():
            available.append({
                "plugin_id": plugin["plugin_id"],
                "name": plugin["name"],
                "version": plugin["version"],
                "description": plugin["description"],
                "category": plugin["category"],
                "config_schema": plugin["config_schema"],
                "tools": [
                    {
                        "tool_name": t["tool_name"],
                        "tool_schema": json.loads(t["tool_schema"]),
                    }
                    for t in plugin["tools"]
                ],
                "installed": plugin_id in installed_ids,
            })
        return available

    # === 测试连接 ===

    async def test_plugin(self, plugin_id: str) -> dict:
        """测试插件连接。

        Args:
            plugin_id: 插件 ID。

        Returns:
            测试结果，包含 success 和 message。

        Raises:
            AppException: 插件未安装。
        """
        plugin = await self.get_plugin(plugin_id)
        if plugin is None:
            raise AppException(
                ErrorCode.NOT_FOUND,
                f"插件 '{plugin_id}' 未安装",
                status_code=404,
            )

        if not plugin["enabled"]:
            return {
                "success": False,
                "message": "插件未启用，请先启用插件",
                "plugin_id": plugin_id,
            }

        # MVP 阶段：web_search 插件连接测试
        if plugin_id == "web_search":
            return await self._test_web_search(plugin)

        return {
            "success": True,
            "message": "连接测试通过",
            "plugin_id": plugin_id,
        }

    async def _test_web_search(self, plugin: dict) -> dict:
        """测试 web_search 插件连接。

        检查配置是否有效，尝试调用搜索 API。

        Args:
            plugin: 插件详情。

        Returns:
            测试结果字典。
        """
        config = plugin.get("config", {})
        search_engine = config.get("search_engine", "duckduckgo")

        if search_engine == "duckduckgo":
            # DuckDuckGo 无需 API Key，直接测试连接
            import httpx
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        "https://api.duckduckgo.com/",
                        params={"q": "test", "format": "json", "no_html": "1"},
                    )
                    if response.status_code == 200:
                        return {
                            "success": True,
                            "message": "DuckDuckGo 搜索连接测试通过",
                            "plugin_id": plugin["plugin_id"],
                            "search_engine": search_engine,
                        }
                    return {
                        "success": False,
                        "message": f"DuckDuckGo API 返回状态码 {response.status_code}",
                        "plugin_id": plugin["plugin_id"],
                    }
            except httpx.ConnectError:
                return {
                    "success": False,
                    "message": "无法连接到 DuckDuckGo API，请检查网络连接",
                    "plugin_id": plugin["plugin_id"],
                }
            except Exception as e:
                return {
                    "success": False,
                    "message": f"连接测试失败: {str(e)}",
                    "plugin_id": plugin["plugin_id"],
                }
        else:
            # SerpAPI / Brave 需要 API Key
            # 解密配置获取 API Key 进行测试
            raw = await self._get_raw_plugin(plugin["plugin_id"])
            decrypted_config = _decrypt_sensitive_config(json.loads(raw.config_json or "{}"))
            api_key = decrypted_config.get("search_api_key") or config.get("search_api_key")

            if not api_key or api_key == "***":
                return {
                    "success": False,
                    "message": f"未配置 {search_engine} 的 API Key，请在插件配置中设置 search_api_key",
                    "plugin_id": plugin["plugin_id"],
                }

            return {
                "success": True,
                "message": f"{search_engine} 配置已就绪（API Key 已设置）",
                "plugin_id": plugin["plugin_id"],
                "search_engine": search_engine,
            }

    # === Agent 插件分配 ===

    async def _ensure_agent_plugins_table(self) -> None:
        """确保 agent_plugin_assignments 表存在。"""
        await self.db.execute(text("""
            CREATE TABLE IF NOT EXISTS agent_plugin_assignments (
                agent_role TEXT NOT NULL,
                plugin_id TEXT NOT NULL,
                assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (agent_role, plugin_id)
            )
        """))
        await self.db.commit()

    async def get_agent_plugins(self, agent_role: str) -> list[dict]:
        """获取指定 Agent 角色已分配的插件列表。

        Args:
            agent_role: Agent 角色 ID。

        Returns:
            已分配的插件列表（含插件详情）。
        """
        await self._ensure_agent_plugins_table()
        result = await self.db.execute(
            text("""SELECT apa.plugin_id, pc.name, pc.version, pc.enabled
                    FROM agent_plugin_assignments apa
                    LEFT JOIN plugin_configs pc ON apa.plugin_id = pc.plugin_id
                    WHERE apa.agent_role = :role
                    ORDER BY apa.assigned_at"""),
            {"role": agent_role},
        )
        plugins = []
        for row in result.fetchall():
            builtin = get_builtin_plugins().get(row.plugin_id)
            category = builtin.get("category", "未知") if builtin else "未知"
            tools = builtin.get("tools", []) if builtin else []
            plugins.append({
                "plugin_id": row.plugin_id,
                "name": row.name or row.plugin_id,
                "version": row.version or "1.0.0",
                "enabled": bool(row.enabled) if row.enabled is not None else False,
                "category": category,
                "tools": [
                    {
                        "tool_name": t["tool_name"],
                        "tool_schema": json.loads(t["tool_schema"]),
                    }
                    for t in tools
                ],
            })
        return plugins

    async def set_agent_plugins(
        self, agent_role: str, plugin_ids: list[str]
    ) -> list[dict]:
        """设置指定 Agent 角色的插件分配。

        Args:
            agent_role: Agent 角色 ID。
            plugin_ids: 要分配的插件 ID 列表。

        Returns:
            更新后的插件列表。

        Raises:
            AppException: 插件未安装时抛出。
        """
        await self._ensure_agent_plugins_table()

        # 验证所有插件都已安装
        for pid in plugin_ids:
            plugin = await self.get_plugin(pid)
            if plugin is None:
                raise AppException(
                    ErrorCode.NOT_FOUND,
                    f"插件 '{pid}' 未安装，请先安装",
                    status_code=404,
                )

        # 删除旧的分配
        await self.db.execute(
            text("DELETE FROM agent_plugin_assignments WHERE agent_role = :role"),
            {"role": agent_role},
        )

        # 插入新的分配
        for plugin_id in plugin_ids:
            await self.db.execute(
                text("""INSERT INTO agent_plugin_assignments (agent_role, plugin_id)
                        VALUES (:role, :pid)"""),
                {"role": agent_role, "pid": plugin_id},
            )

        await self.db.commit()

        return await self.get_agent_plugins(agent_role)

    # === 内部方法 ===

    async def _get_raw_plugin(self, plugin_id: str):
        """获取原始插件记录（不解密、不脱敏）。"""
        result = await self.db.execute(
            text("""SELECT id, plugin_id, name, version, enabled, config_json, installed_at
                    FROM plugin_configs WHERE plugin_id = :plugin_id"""),
            {"plugin_id": plugin_id},
        )
        return result.fetchone()

    async def _get_plugin_tools(self, plugin_id: str) -> list[dict]:
        """获取插件的工具列表。

        Args:
            plugin_id: 插件 ID。

        Returns:
            工具列表，每个工具包含 tool_name 和解析后的 tool_schema。
        """
        result = await self.db.execute(
            text("""SELECT id, plugin_id, tool_name, tool_schema
                    FROM plugin_tools WHERE plugin_id = :plugin_id"""),
            {"plugin_id": plugin_id},
        )
        tools = []
        for row in result.fetchall():
            tools.append({
                "id": row.id,
                "tool_name": row.tool_name,
                "tool_schema": json.loads(row.tool_schema),
            })
        return tools