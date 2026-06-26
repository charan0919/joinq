import uuid
from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date

from app.db import get_db
from app.models.models import Queue, Token, Business
from app.schemas.schemas import APIResponse
from app.core.security import get_current_user

import traceback

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── 1. Business Overview Analytics ──────────────────────────────
@router.get("/overview")
async def get_overview(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        business_id = uuid.UUID(current_user["business_id"])

        # Total queues
        total_queues_result = await db.execute(
            select(func.count(Queue.id)).where(
                Queue.business_id == business_id
            )
        )
        total_queues = total_queues_result.scalar() or 0

        # Active queues
        active_queues_result = await db.execute(
            select(func.count(Queue.id)).where(
                Queue.business_id == business_id,
                Queue.status == "ACTIVE",
            )
        )
        active_queues = active_queues_result.scalar() or 0

        # Get all queue IDs for this business
        queues_result = await db.execute(
            select(Queue.id).where(Queue.business_id == business_id)
        )
        queue_ids = [row[0] for row in queues_result.all()]

        if not queue_ids:
            return APIResponse(
                success=True,
                data={
                    "total_queues": 0,
                    "active_queues": 0,
                    "total_customers_served": 0,
                    "total_customers_waiting": 0,
                    "avg_wait_time": 0,
                },
                message="Analytics fetched successfully",
            )

        # Total served today
        today = date.today()
        served_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id.in_(queue_ids),
                Token.status == "SERVED",
                cast(Token.served_at, Date) == today,
            )
        )
        total_served = served_result.scalar() or 0

        # Total currently waiting
        waiting_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id.in_(queue_ids),
                Token.status == "WAITING",
            )
        )
        total_waiting = waiting_result.scalar() or 0

        # Average wait time (for served tokens today)
        avg_wait_result = await db.execute(
            select(
                func.avg(
                    func.extract(
                        "epoch",
                        Token.served_at - Token.joined_at
                    )
                )
            ).where(
                Token.queue_id.in_(queue_ids),
                Token.status == "SERVED",
                Token.served_at.isnot(None),
                cast(Token.served_at, Date) == today,
            )
        )
        avg_wait_seconds = avg_wait_result.scalar()
        avg_wait_minutes = round(avg_wait_seconds / 60, 1) if avg_wait_seconds else 0

        return APIResponse(
            success=True,
            data={
                "total_queues": total_queues,
                "active_queues": active_queues,
                "total_customers_served": total_served,
                "total_customers_waiting": total_waiting,
                "avg_wait_time_minutes": avg_wait_minutes,
            },
            message="Analytics fetched successfully",
        )
    except Exception as e:
        print("OVERVIEW ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Queue Specific Analytics ──────────────────────────────────
@router.get("/queue/{queue_id}")
async def get_queue_analytics(
    queue_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Verify queue belongs to this business
        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == uuid.UUID(current_user["business_id"]),
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        today = date.today()

        # Today's stats
        served_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "SERVED",
                cast(Token.served_at, Date) == today,
            )
        )
        total_served = served_result.scalar() or 0

        skipped_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "SKIPPED",
            )
        )
        total_skipped = skipped_result.scalar() or 0

        cancelled_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "CANCELLED",
            )
        )
        total_cancelled = cancelled_result.scalar() or 0

        waiting_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "WAITING",
            )
        )
        total_waiting = waiting_result.scalar() or 0

        # Total joined ever
        total_joined_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
            )
        )
        total_joined = total_joined_result.scalar() or 0

        # Average wait time
        avg_wait_result = await db.execute(
            select(
                func.avg(
                    func.extract(
                        "epoch",
                        Token.served_at - Token.joined_at
                    )
                )
            ).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "SERVED",
                Token.served_at.isnot(None),
            )
        )
        avg_wait_seconds = avg_wait_result.scalar()
        avg_wait_minutes = round(avg_wait_seconds / 60, 1) if avg_wait_seconds else 0

        return APIResponse(
            success=True,
            data={
                "queue_id": queue_id,
                "queue_name": queue.name,
                "status": queue.status,
                "avg_service_time": queue.avg_service_time,
                "total_joined": total_joined,
                "total_served": total_served,
                "total_waiting": total_waiting,
                "total_skipped": total_skipped,
                "total_cancelled": total_cancelled,
                "avg_wait_time_minutes": avg_wait_minutes,
            },
            message="Queue analytics fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("QUEUE ANALYTICS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Top Performing Queues ─────────────────────────────────────
@router.get("/top-queues")
async def get_top_queues(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        business_id = uuid.UUID(current_user["business_id"])

        queues_result = await db.execute(
            select(Queue).where(Queue.business_id == business_id)
        )
        queues = queues_result.scalars().all()

        queue_stats = []
        for queue in queues:
            served_result = await db.execute(
                select(func.count(Token.id)).where(
                    Token.queue_id == queue.id,
                    Token.status == "SERVED",
                )
            )
            total_served = served_result.scalar() or 0

            waiting_result = await db.execute(
                select(func.count(Token.id)).where(
                    Token.queue_id == queue.id,
                    Token.status == "WAITING",
                )
            )
            total_waiting = waiting_result.scalar() or 0

            avg_wait_result = await db.execute(
                select(
                    func.avg(
                        func.extract(
                            "epoch",
                            Token.served_at - Token.joined_at
                        )
                    )
                ).where(
                    Token.queue_id == queue.id,
                    Token.status == "SERVED",
                    Token.served_at.isnot(None),
                )
            )
            avg_wait_seconds = avg_wait_result.scalar()
            avg_wait_minutes = round(avg_wait_seconds / 60, 1) if avg_wait_seconds else 0

            queue_stats.append({
                "queue_id": str(queue.id),
                "queue_name": queue.name,
                "status": queue.status,
                "total_served": total_served,
                "total_waiting": total_waiting,
                "avg_wait_time_minutes": avg_wait_minutes,
            })

        # Sort by total served descending
        queue_stats.sort(key=lambda x: x["total_served"], reverse=True)

        return APIResponse(
            success=True,
            data=queue_stats,
            message="Top queues fetched successfully",
        )
    except Exception as e:
        print("TOP QUEUES ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))