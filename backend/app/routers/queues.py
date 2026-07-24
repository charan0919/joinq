import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db import get_db
from app.models.models import Queue, Token, Business
from app.schemas.schemas import (
    QueueCreateRequest,
    QueueResponse,
    QueueStatusUpdateRequest,
    TokenVendorResponse,
    TokenStatusUpdateRequest,
    APIResponse,
)
from app.core.security import get_current_user
from datetime import datetime, timezone
import traceback

router = APIRouter(prefix="/queues", tags=["Queue Management"])


# ── 1. Create Queue ─────────────────────────────────────────────
@router.post("", status_code=201)
async def create_queue(
    payload: QueueCreateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        queue = Queue(
            id=uuid.uuid4(),
            business_id=current_user["business_id"],
            name=payload.name,
            prefix=payload.prefix.upper(),
            avg_service_time=payload.avg_service_time,
            status="ACTIVE",
        )
        db.add(queue)
        await db.commit()
        await db.refresh(queue)

        return APIResponse(
            success=True,
            data={
                "queue_id": str(queue.id),
                "name": queue.name,
                "prefix": queue.prefix,
                "status": queue.status,
                "avg_service_time": queue.avg_service_time,
                "waiting_count": 0,
                "qr_code_url": queue.qr_code_url,
                "created_at": str(queue.created_at),
            },
            message="Queue created successfully",
        )
    except Exception as e:
        print("CREATE QUEUE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. List All Queues for Business ─────────────────────────────
@router.get("")
async def list_queues(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue).where(
                Queue.business_id == current_user["business_id"]
            )
        )
        queues = result.scalars().all()

        queue_list = []
        for q in queues:
            count_result = await db.execute(
                select(func.count(Token.id)).where(
                    Token.queue_id == q.id,
                    Token.status == "WAITING",
                )
            )
            waiting_count = count_result.scalar() or 0

            queue_list.append({
                "queue_id": str(q.id),
                "name": q.name,
                "prefix": q.prefix,
                "status": q.status,
                "avg_service_time": q.avg_service_time,
                "waiting_count": waiting_count,
                "qr_code_url": q.qr_code_url,
                "created_at": str(q.created_at),
            })

        return APIResponse(
            success=True,
            data=queue_list,
            message="Queues fetched successfully",
        )
    except Exception as e:
        print("LIST QUEUES ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Get Single Queue ──────────────────────────────────────────
@router.get("/{queue_id}")
async def get_queue(
    queue_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == current_user["business_id"],
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        count_result = await db.execute(
            select(func.count(Token.id)).where(
                Token.queue_id == queue.id,
                Token.status == "WAITING",
            )
        )
        waiting_count = count_result.scalar() or 0

        return APIResponse(
            success=True,
            data={
                "queue_id": str(queue.id),
                "name": queue.name,
                "prefix": queue.prefix,
                "status": queue.status,
                "avg_service_time": queue.avg_service_time,
                "waiting_count": waiting_count,
                "qr_code_url": queue.qr_code_url,
                "created_at": str(queue.created_at),
            },
            message="Queue fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("GET QUEUE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Update Queue Status (ACTIVE / PAUSED / CLOSED) ───────────
@router.patch("/{queue_id}/status")
async def update_queue_status(
    queue_id: str,
    payload: QueueStatusUpdateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        if payload.status not in ("ACTIVE", "PAUSED", "CLOSED"):
            raise HTTPException(
                status_code=400,
                detail="Status must be ACTIVE, PAUSED, or CLOSED",
            )

        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == current_user["business_id"],
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        queue.status = payload.status
        queue.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return APIResponse(
            success=True,
            data={"queue_id": queue_id, "status": payload.status},
            message=f"Queue status updated to {payload.status}",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE STATUS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Get Waiting Customers in Queue ───────────────────────────
@router.get("/{queue_id}/tokens")
async def get_queue_tokens(
    queue_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == current_user["business_id"],
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        from app.models.models import Customer
        tokens_result = await db.execute(
            select(Token, Customer)
            .join(Customer, Token.customer_id == Customer.id)
            .where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "WAITING",
            )
            .order_by(Token.joined_at)
        )
        rows = tokens_result.all()

        token_list = []
        for position, (token, customer) in enumerate(rows, start=1):
            token_list.append({
                "token_id": str(token.id),
                "token_number": token.token_number,
                "customer_name": customer.name,
                "customer_phone": customer.phone,
                "status": token.status,
                "position": position,
                "joined_at": str(token.joined_at),
            })

        return APIResponse(
            success=True,
            data=token_list,
            message="Tokens fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("GET TOKENS ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 6. Call Next Customer ────────────────────────────────────────
@router.post("/{queue_id}/next")
async def call_next(
    queue_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == current_user["business_id"],
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        if queue.status != "ACTIVE":
            raise HTTPException(
                status_code=400, detail="Queue is not active"
            )

        next_result = await db.execute(
            select(Token)
            .where(
                Token.queue_id == uuid.UUID(queue_id),
                Token.status == "WAITING",
            )
            .order_by(Token.joined_at)
            .limit(1)
        )
        next_token = next_result.scalar_one_or_none()
        if not next_token:
            raise HTTPException(
                status_code=404, detail="No customers waiting"
            )

        next_token.status = "CALLED"
        next_token.called_at = datetime.now(timezone.utc)
        await db.commit()
        # Send WhatsApp notification
        try:
            from app.models.models import Customer
            cust_result = await db.execute(
                select(Customer).where(Customer.id == next_token.customer_id)
            )
            customer = cust_result.scalar_one_or_none()
            if customer:
                from app.services.notifications import notify_token_called
                await notify_token_called(
                    phone=customer.phone,
                    customer_name=customer.name,
                    token_number=next_token.token_number,
                    queue_name=queue.name,
                )
        except Exception:
            pass  # Never let notification failure break the main flow

        return APIResponse(
            success=True,
            data={
                "token_id": str(next_token.id),
                "token_number": next_token.token_number,
                "status": "CALLED",
            },
            message=f"Token {next_token.token_number} called",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("CALL NEXT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 7. Update Token Status (SERVED / SKIPPED / CANCELLED) ───────
@router.patch("/{queue_id}/tokens/{token_id}")
async def update_token_status(
    queue_id: str,
    token_id: str,
    payload: TokenStatusUpdateRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        if payload.status not in ("SERVED", "SKIPPED", "CANCELLED"):
            raise HTTPException(
                status_code=400,
                detail="Status must be SERVED, SKIPPED, or CANCELLED",
            )

        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == current_user["business_id"],
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        token_result = await db.execute(
            select(Token).where(
                Token.id == uuid.UUID(token_id),
                Token.queue_id == uuid.UUID(queue_id),
            )
        )
        token = token_result.scalar_one_or_none()
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")

        token.status = payload.status
        if payload.status == "SERVED":
            token.served_at = datetime.now(timezone.utc)
        await db.commit()

        return APIResponse(
            success=True,
            data={
                "token_id": token_id,
                "status": payload.status,
            },
            message=f"Token marked as {payload.status}",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE TOKEN ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
# ── 8. Delete Queue ──────────────────────────────────────────────
@router.delete("/{queue_id}")
async def delete_queue(
    queue_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Queue).where(
                Queue.id == uuid.UUID(queue_id),
                Queue.business_id == uuid.UUID(current_user["business_id"]),
            )
        )
        queue = result.scalar_one_or_none()
        if not queue:
            raise HTTPException(status_code=404, detail="Queue not found")

        # Delete associated tokens first (foreign key constraint)
        tokens_result = await db.execute(
            select(Token).where(Token.queue_id == uuid.UUID(queue_id))
        )
        tokens = tokens_result.scalars().all()
        for token in tokens:
            await db.delete(token)

        await db.flush()
        await db.delete(queue)
        await db.commit()

        return APIResponse(
            success=True,
            data={"queue_id": queue_id},
            message="Queue deleted successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("DELETE QUEUE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))