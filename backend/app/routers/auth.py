from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db import get_db
from app.models.models import Business, User
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, APIResponse
from app.core.security import hash_password, verify_password, create_access_token
from datetime import datetime
import uuid
import traceback

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == payload.email))
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

        business = Business(
            id=uuid.uuid4(),
            name=payload.business_name,
            phone=payload.business_phone,
            address=payload.business_address,
        )
        db.add(business)
        await db.flush()

        user = User(
            id=uuid.uuid4(),
            business_id=business.id,
            name=payload.vendor_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role="OWNER",
        )
        db.add(user)
        await db.commit()

        return APIResponse(
            success=True,
            data={
                "vendor_id": str(user.id),
                "business_id": str(business.id),
                "email": user.email
            },
            message="Account created successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        print("REGISTER ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")

        # Update last_login_at
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(last_login_at=datetime.utcnow())
        )
        await db.commit()

        token = create_access_token(data={
            "sub": str(user.id),
            "business_id": str(user.business_id),
            "role": user.role
        })

        return APIResponse(
            success=True,
            data={
                "access_token": token,
                "token_type": "bearer",
                "expires_in": 86400
            },
            message="Login successful"
        )
    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout():
    return APIResponse(
        success=True,
        data=None,
        message="Logged out successfully"
    )