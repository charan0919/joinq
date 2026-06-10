import uuid
from sqlalchemy import (
    Column, String, Boolean, Integer,
    Text, ForeignKey, CheckConstraint, TIMESTAMP
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db import Base


class Business(Base):
    __tablename__ = "businesses"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(255), nullable=False)
    phone      = Column(String(20))
    address    = Column(Text)
    logo_url   = Column(Text)
    is_active  = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id   = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    name          = Column(String(255), nullable=False)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role          = Column(String(50), nullable=False)
    is_active     = Column(Boolean, default=True)
    last_login_at = Column(TIMESTAMP(timezone=True))
    created_at    = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('OWNER','STAFF')", name="users_role_check"),
    )


class Queue(Base):
    __tablename__ = "queues"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id      = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    name             = Column(String(255), nullable=False)
    prefix           = Column(String(10), nullable=False)
    avg_service_time = Column(Integer, nullable=False, default=10)
    status           = Column(String(20), nullable=False, default="ACTIVE")
    qr_code_url      = Column(Text)
    created_at       = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at       = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('ACTIVE','PAUSED','CLOSED')",
            name="queues_status_check"
        ),
    )


class Customer(Base):
    __tablename__ = "customers"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(255), nullable=False)
    phone      = Column(String(20), unique=True, nullable=False)
    email      = Column(String(255))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Token(Base):
    __tablename__ = "tokens"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    queue_id      = Column(UUID(as_uuid=True), ForeignKey("queues.id"), nullable=False)
    customer_id   = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    token_number  = Column(String(20), nullable=False)
    status        = Column(String(20), nullable=False, default="WAITING")
    session_token = Column(String(255), unique=True, nullable=False)
    notified_pos2 = Column(Boolean, default=False)
    notified_pos1 = Column(Boolean, default=False)
    joined_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())
    called_at     = Column(TIMESTAMP(timezone=True))
    served_at     = Column(TIMESTAMP(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('WAITING','CALLED','SERVED','SKIPPED','CANCELLED')",
            name="tokens_status_check"
        ),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_id = Column(UUID(as_uuid=True), ForeignKey("tokens.id"), nullable=False)