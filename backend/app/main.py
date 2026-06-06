from fastapi import FastAPI

from app.core.config import get_settings
from app.db import check_database_health

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    return {"message": "JoinQ backend is running"}


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db", tags=["health"])
async def database_health() -> dict[str, object]:
    return await check_database_health(settings)
