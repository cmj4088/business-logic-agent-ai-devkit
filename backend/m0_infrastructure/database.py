"""数据库引擎和会话管理 — M0 基础设施。

使用 SQLAlchemy 2.0 async 引擎，配置 SQLite WAL 模式。
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

from .config import get_settings

# 全局引擎和会话工厂
_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def init_db(settings) -> None:
    """初始化数据库引擎和连接池，配置 WAL 模式。"""
    global _engine, _session_factory

    db_path = settings.database_path
    # 确保数据目录存在
    import os
    os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else "data", exist_ok=True)

    database_url = f"sqlite+aiosqlite:///{db_path}"

    _engine = create_async_engine(
        database_url,
        echo=settings.debug,
        connect_args={"check_same_thread": False},
    )

    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # 配置 WAL 模式
    async with _engine.begin() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL;"))
        await conn.execute(text("PRAGMA synchronous=NORMAL;"))
        await conn.execute(text("PRAGMA busy_timeout=5000;"))
        await conn.execute(text("PRAGMA foreign_keys=ON;"))
        await conn.execute(text("PRAGMA cache_size=-8000;"))

    # 运行迁移
    await _run_migrations()


async def _run_migrations() -> None:
    """运行数据库迁移脚本。"""
    import os
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    if not os.path.exists(migrations_dir):
        return

    async with _engine.begin() as conn:
        # 创建迁移记录表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # 按顺序执行迁移
        migration_files = sorted(f for f in os.listdir(migrations_dir) if f.endswith(".sql"))
        for filename in migration_files:
            # 检查是否已执行
            result = await conn.execute(
                text("SELECT id FROM _migrations WHERE filename = :filename"),
                {"filename": filename}
            )
            if result.fetchone() is not None:
                continue

            # 执行迁移
            filepath = os.path.join(migrations_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                sql = f.read()
            for statement in sql.split(";"):
                statement = statement.strip()
                if statement:
                    await conn.execute(text(statement))

            # 记录迁移
            await conn.execute(
                text("INSERT INTO _migrations (filename) VALUES (:filename)"),
                {"filename": filename}
            )


async def close_db() -> None:
    """关闭数据库连接。"""
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None


async def get_db() -> AsyncSession:
    """获取数据库会话（依赖注入用）。

    Yields:
        AsyncSession: SQLAlchemy 异步会话。

    Usage:
        @app.get("/api/example")
        async def example(db: AsyncSession = Depends(get_db)):
            ...
    """
    if _session_factory is None:
        raise RuntimeError("数据库未初始化，请先调用 init_db()")
    async with _session_factory() as session:
        try:
            yield session
        finally:
            await session.close()