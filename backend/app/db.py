import psycopg

from app.core.config import Settings


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
        async with await psycopg.AsyncConnection.connect(**_connection_kwargs(settings)) as connection:
            async with connection.cursor() as cursor:
                await cursor.execute("SELECT 1")
                row = await cursor.fetchone()

        return {
            "status": "ok",
            "database": settings.db_name,
            "host": settings.db_host,
            "reachable": bool(row and row[0] == 1),
        }
    except Exception as exc:  # pragma: no cover - exercised by runtime checks
        return {
            "status": "error",
            "database": settings.db_name,
            "host": settings.db_host,
            "reachable": False,
            "detail": str(exc),
        }
