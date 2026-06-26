import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models.models import Business, User
from app.schemas.schemas import (
    BusinessProfileResponse,
    BusinessUpdateRequest,
    APIResponse,
)
from app.core.security import get_current_user

import traceback

router = APIRouter(prefix="/business", tags=["Business Profile"])


# ── 1. Get Business Profile ──────────────────────────────────────
@router.get("/profile")
async def get_business_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Business).where(
                Business.id == uuid.UUID(current_user["business_id"])
            )
        )
        business = result.scalar_one_or_none()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")

        return APIResponse(
            success=True,
            data={
                "business_id": str(business.id),
                "name": business.name,
                "phone": business.phone,
                "address": business.address,
                "logo_url": business.logo_url,
                "is_active": business.is_active,
                "created_at": str(business.created_at),
            },
            message="Business profile fetched successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("GET PROFILE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Update Business Profile ───────────────────────────────────
@router.patch("/profile")
async def update_business_profile(
    payload: BusinessUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(Business).where(
                Business.id == uuid.UUID(current_user["business_id"])
            )
        )
        business = result.scalar_one_or_none()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")

        if payload.name is not None:
            business.name = payload.name
        if payload.phone is not None:
            business.phone = payload.phone
        if payload.address is not None:
            business.address = payload.address

        business.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return APIResponse(
            success=True,
            data={
                "business_id": str(business.id),
                "name": business.name,
                "phone": business.phone,
                "address": business.address,
                "logo_url": business.logo_url,
                "is_active": business.is_active,
                "created_at": str(business.created_at),
            },
            message="Business profile updated successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        print("UPDATE PROFILE ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Get Business Staff List ───────────────────────────────────
@router.get("/staff")
async def get_staff(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(User).where(
                User.business_id == uuid.UUID(current_user["business_id"])
            )
        )
        users = result.scalars().all()

        staff_list = []
        for user in users:
            staff_list.append({
                "user_id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "last_login_at": str(user.last_login_at) if user.last_login_at else None,
                "created_at": str(user.created_at),
            })

        return APIResponse(
            success=True,
            data=staff_list,
            message="Staff list fetched successfully",
        )
    except Exception as e:
        print("GET STAFF ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))