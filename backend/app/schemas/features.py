"""Validation schemas for persisted BridgePoint feature records."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class AvailabilityUpdate(BaseModel):
    is_available: bool


class AvailabilityResponse(BaseModel):
    worker_id: int
    is_available: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0)


class LocationResponse(LocationUpdate):
    worker_id: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class CertificationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    issuing_organization: str = Field(..., min_length=2, max_length=255)
    issue_date: date
    expiry_date: date | None = None
    credential_id: str | None = Field(default=None, max_length=255)


class CertificationResponse(CertificationCreate):
    id: int
    worker_id: int
    verification_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderVerificationResponse(BaseModel):
    worker_id: int
    worker_name: str
    labor_category: str | None = None
    city: str | None = None
    skills: list[str]
    status: str


class WelfareUpdate(BaseModel):
    support_type: str = Field(..., min_length=2, max_length=100)
    status: str = Field(default="available", max_length=30)
    eligibility: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class WelfareResponse(WelfareUpdate):
    id: int
    worker_id: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class InsuranceCreate(BaseModel):
    provider: str = Field(..., min_length=2, max_length=255)
    policy_name: str = Field(..., min_length=2, max_length=255)
    policy_number: str | None = Field(default=None, max_length=255)
    coverage: str | None = None
    start_date: date | None = None
    expiry_date: date | None = None
    status: str = Field(default="active", max_length=30)
    claim_status: str = Field(default="none", max_length=30)


class InsuranceResponse(InsuranceCreate):
    id: int
    worker_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: int
    job_id: int
    job_status: str
    invoice_number: str
    employer_id: int
    worker_id: int | None
    employer_name: str
    worker_name: str | None
    service: str
    job_date: datetime
    amount: float
    commission: float
    total: float
    payment_status: str
    transaction_reference: str | None
    created_at: datetime


class NotificationResponse(BaseModel):
    id: int
    kind: str
    title: str
    body: str
    destination: str | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EmergencyCreate(BaseModel):
    category: str = Field(..., min_length=2, max_length=100)
    urgency: str = Field(default="high", pattern=r"^(critical|high|normal)$")
    description: str = Field(..., min_length=10, max_length=2000)
    address: str = Field(..., min_length=5, max_length=1000)
    city: str = Field(..., min_length=2, max_length=100)


class EmergencyStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(open|responded|in_progress|resolved|cancelled)$")


class EmergencyResponse(EmergencyCreate):
    id: int
    customer_id: int
    assigned_worker_id: int | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
