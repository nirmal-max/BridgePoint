from datetime import datetime
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    registration_number: str | None = Field(default=None, max_length=100)
    description: str | None = None
    state: str | None = None
    district: str | None = None
    city: str | None = None
    address: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    registration_number: str | None = Field(default=None, max_length=100)
    description: str | None = None
    state: str | None = None
    district: str | None = None
    city: str | None = None
    address: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: str | None = None


class MembershipCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    membership_type: str = "worker"
    membership_number: str | None = Field(default=None, max_length=100)


class MembershipUpdate(BaseModel):
    status: str


def iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
