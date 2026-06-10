import asyncio
import sys
import traceback

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db import AsyncSessionLocal
from app.models.models import Business, User
from app.core.security import hash_password
from sqlalchemy import select
import uuid

async def test():
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == 'test@test.com')
            )
            existing = result.scalar_one_or_none()
            print('Email check passed, existing:', existing)

            business = Business(
                id=uuid.uuid4(),
                name='Test Clinic',
                phone='9876543210',
                address='Test Address',
            )
            db.add(business)
            await db.flush()
            print('Business created:', business.id)

            user = User(
                id=uuid.uuid4(),
                business_id=business.id,
                name='Test Vendor',
                email='test@test.com',
                password_hash=hash_password('Test@1234'),
                role='OWNER',
            )
            db.add(user)
            await db.commit()
            print('SUCCESS - User created:', user.id)

    except Exception as e:
        print('ERROR:', str(e))
        traceback.print_exc()

asyncio.run(test())
