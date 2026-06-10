from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


# ── Auth ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    business_name:    str
    business_phone:   Optional[str] = None
    business_address: Optional[str] = None
    vendor_name:      str
    email:            str
    password:         str

class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int = 86400


# ── Business ─────────────────────────────────────────────────

class BusinessProfileResponse(BaseModel):
    business_id: UUID
    name:        str
    phone:       Optional[str]
    address:     Optional[str]
    logo_url:    Optional[str]
    created_at:  datetime

    class Config:
        from_attributes = True

class BusinessUpdateRequest(BaseModel):
    name:    Optional[str] = None
    phone:   Optional[str] = None
    address: Optional[str] = None


# ── Queues ───────────────────────────────────────────────────

class QueueCreateRequest(BaseModel):
    name:             str
    prefix:           str
    avg_service_time: int = 10

class QueueResponse(BaseModel):
    queue_id:         UUID
    name:             str
    prefix:           str
    status:           str
    avg_service_time: int
    waiting_count:    int = 0
    qr_code_url:      Optional[str]
    created_at:       datetime

    class Config:
        from_attributes = True

class QueueStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE | PAUSED | CLOSED


# ── Tokens (Vendor view) ─────────────────────────────────────

class TokenVendorResponse(BaseModel):
    token_id:      UUID
    token_number:  str
    customer_name: str
    customer_phone: str
    status:        str
    position:      Optional[int]
    joined_at:     datetime

    class Config:
        from_attributes = True

class TokenStatusUpdateRequest(BaseModel):
    status: str  # SERVED | SKIPPED | CANCELLED


# ── Customer Flow ────────────────────────────────────────────

class QueueInfoResponse(BaseModel):
    queue_id:           UUID
    business_name:      str
    queue_name:         str
    status:             str
    waiting_count:      int
    estimated_wait_time: int

class JoinQueueRequest(BaseModel):
    name:  str
    phone: str
    email: Optional[str] = None

class JoinQueueResponse(BaseModel):
    token_id:            UUID
    token_number:        str
    position:            int
    estimated_wait_time: int
    session_token:       str
    queue_name:          str
    business_name:       str

class TokenStatusResponse(BaseModel):
    token_id:            UUID
    token_number:        str
    status:              str
    position:            Optional[int]
    estimated_wait_time: Optional[int]
    called_at:           Optional[datetime]
    served_at:           Optional[datetime]

    class Config:
        from_attributes = True


# ── Analytics ────────────────────────────────────────────────

class QueueAnalyticsResponse(BaseModel):
    date:             str
    total_joined:     int
    total_served:     int
    total_skipped:    int
    total_cancelled:  int
    avg_wait_time:    Optional[float]
    peak_hour:        Optional[str]
    avg_service_time: int


# ── Generic response wrapper ─────────────────────────────────
from typing import Any

class APIResponse(BaseModel):
    success: bool
    data:    Optional[Any] = None
    message: str