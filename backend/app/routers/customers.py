import uuid
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db import get_db
from app.models.models import Queue, Customer, Token, Business
from app.schemas.schemas import (
    QueueInfoResponse,
    JoinQueueRequest,
    JoinQueueResponse,
    TokenStatusResponse,
    APIResponse,
)

import traceback

router = APIRouter(prefix="/customer", tags=["Customer Flow"])


# ── 1. Get Queue Info (public, no auth needed) ───────────────────
@router.get("/queue/{queue_id}")
async def get_queue_info(
    queue_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue, Business)
            .join(Business, Queue.business_id == Business.id)
            .where(Queue.id == uuid.UUID(queue_id))
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Queue not found")

        queue, business = row

        if queue.status == "CLOSED":
            raise HTTPException(status_code=400, detail="Queue is closed")

        count_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == queue.id,
                Token.status == "WAITING",
            )
        )
        waiting_count = count_result.scalar() or 0
        estimated_wait = waiting_count * queue.avg_service_time

        return APIResponse(
            success=True,
            data={
                "queue_id": str(queue.id),
                "business_name": business.name,
                "queue_name": queue.name,
                "status": queue.status,
                "waiting_count": waiting_count,
                "estimated_wait_time": estimated_wait,
            },
            message="Queue info fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("GET QUEUE INFO ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Join Queue ─────────────────────────────────────────────────
@router.post("/queue/{queue_id}/join")
async def join_queue(
    queue_id: str,
    payload: JoinQueueRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        # Check queue exists and is active
        result = await db.execute(
            select(Queue, Business)
            .join(Business, Queue.business_id == Business.id)
            .where(Queue.id == uuid.UUID(queue_id))
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Queue not found")

        queue, business = row

        if queue.status != "ACTIVE":
            raise HTTPException(
                status_code=400,
                detail=f"Queue is {queue.status.lower()}, not accepting customers",
            )

        # Get or create customer by phone number
        cust_result = await db.execute(
            select(Customer).where(Customer.phone == payload.phone)
        )
        customer = cust_result.scalar_one_or_none()

        if not customer:
            customer = Customer(
                id=uuid.uuid4(),
                name=payload.name,
                phone=payload.phone,
                email=payload.email,
            )
            db.add(customer)
            await db.flush()

        # Check if customer already in this queue
        existing_result = await db.execute(
            select(Token).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.customer_id == customer.id,
                Token.status.in_(["WAITING", "CALLED"]),
            )
        )
        existing_token = existing_result.scalar_one_or_none()
        if existing_token:
            raise HTTPException(
                status_code=409,
                detail="Customer already in this queue",
            )

        # Generate token number
        count_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id)
            )
        )
        total_tokens = count_result.scalar() or 0
        token_number = f"{queue.prefix}-{total_tokens + 1:02d}"

        # Calculate position and wait time
        waiting_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "WAITING",
            )
        )
        waiting_count = waiting_result.scalar() or 0
        position = waiting_count + 1
        estimated_wait = position * queue.avg_service_time

        # Create token
        session_token = secrets.token_urlsafe(32)
        token = Token(
            id=uuid.uuid4(),
            queue_id=uuid.UUID(queue_id),
            customer_id=customer.id,
            token_number=token_number,
            status="WAITING",
            session_token=session_token,
        )
        db.add(token)
        await db.commit()

        return APIResponse(
            success=True,
            data={
                "token_id": str(token.id),
                "token_number": token_number,
                "position": position,
                "estimated_wait_time": estimated_wait,
                "session_token": session_token,
                "queue_name": queue.name,
                "business_name": business.name,
            },
            message="Successfully joined the queue",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("JOIN QUEUE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Poll Token Status (customer checks their position) ────────
@router.get("/token/{token_id}/status")
async def get_token_status(
    token_id: str,
    session_token: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Token).where(
                Token.id == uuid.UUID(token_id),
                Token.session_token == session_token,
            )
        )
        token = result.scalar_one_or_none()
        if not token:
            raise HTTPException(
                status_code=404,
                detail="Token not found or invalid session",
            )

        position = None
        estimated_wait = None

        if token.status == "WAITING":
            position_result = await db.execute(
                select(func.count(Token.id)).where(
                    Token.queue_id == token.queue_id,
                    Token.status == "WAITING",
                    Token.joined_at < token.joined_at,
                )
            )
            position = (position_result.scalar() or 0) + 1

            queue_result = await db.execute(
                select(Queue).where(Queue.id == token.queue_id)
            )
            queue = queue_result.scalar_one_or_none()
            if queue:
                estimated_wait = position * queue.avg_service_time

        return APIResponse(
            success=True,
            data={
                "token_id": str(token.id),
                "token_number": token.token_number,
                "status": token.status,
                "position": position,
                "estimated_wait_time": estimated_wait,
                "called_at": str(token.called_at) if token.called_at else None,
                "served_at": str(token.served_at) if token.served_at else None,
            },
            message="Token status fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("TOKEN STATUS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Leave Queue (customer cancels their token) ─────────────────
@router.delete("/token/{token_id}/leave")
async def leave_queue(
    token_id: str,
    session_token: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Token).where(
                Token.id == uuid.UUID(token_id),
                Token.session_token == session_token,
            )
        )
        token = result.scalar_one_or_none()
        if not token:
            raise HTTPException(
                status_code=404,
                detail="Token not found or invalid session",
            )

        if token.status not in ("WAITING", "CALLED"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot leave queue with status {token.status}",
            )

        token.status = "CANCELLED"
        await db.commit()

        return APIResponse(
            success=True,
            data={"token_id": token_id, "status": "CANCELLED"},
            message="Successfully left the queue",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("LEAVE QUEUE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))