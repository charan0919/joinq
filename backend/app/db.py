import psycopg
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import Settings, settings

# SQLAlchemy Base — all models inherit from this
class Base(DeclarativeBase):
    pass

# Async engine for SQLAlchemy ORM
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_size=10,
    max_overflow=20
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency for FastAPI endpoints
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# ── Kuldeep's original health check function (keep this) ──
def _connection_kwargs(settings: Settings) -> dict[str, object]:
    kwargs: dict[str, object] = {
        "host": settings.db_host,
        "port": settings.db_port,
        "user": settings.db_user,
        "password": settings.db_password,
        "dbname": settings.db_name,
        "sslmode": settings.db_sslmode,
    }
    if settings.db_sslrootcert:
        kwargs["sslrootcert"] = settings.db_sslrootcert
    return kwargs

async def check_database_health(settings: Settings) -> dict[str, object]:
    try:
        async with await psycopg.AsyncConnection.connect(
            **_connection_kwargs(settings)
        ) as connection:
            async with connection.cursor() as cursor:
                await cursor.execute("SELECT 1")
                row = await cursor.fetchone()
        return {
            "status": "ok",
            "database": settings.db_name,
            "host": settings.db_host,
            "reachable": bool(row and row[0] == 1),
        }
    except Exception as exc:
        return {
            "status": "error",
            "database": settings.db_name,
            "host": settings.db_host,
            "reachable": False,
            "detail": str(exc),
        }