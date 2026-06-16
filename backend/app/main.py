import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db import check_database_health
from app.routers import auth , queues

app = FastAPI(
    title="JoinQ API",
    description="Digital Queue Management Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://joinq.unitedtechlab.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(queues.router)

@app.get("/")
async def root():
    return {"message": "JoinQ API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.APP_ENV
    }

@app.get("/health/db")
async def database_health():
    return await check_database_health(settings)