"""Persisted worker, notification, invoice, and emergency feature records."""

from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class WorkerAvailability(Base):
    __tablename__ = "worker_availability"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    is_available = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Certification(Base):
    __tablename__ = "certifications"
    __table_args__ = (Index("ix_certifications_worker_status", "worker_id", "verification_status"),)

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    verification_status = Column(String(30), nullable=False, default="SELF_DECLARED")
    credential_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class WelfareRecord(Base):
    __tablename__ = "welfare_records"
    __table_args__ = (UniqueConstraint("worker_id", "support_type", name="uq_welfare_worker_type"),)

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    support_type = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False, default="available")
    eligibility = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"
    __table_args__ = (Index("ix_insurance_worker_status", "worker_id", "status"),)

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(255), nullable=False)
    policy_name = Column(String(255), nullable=False)
    policy_number = Column(String(255), nullable=True)
    coverage = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="active")
    claim_status = Column(String(30), nullable=False, default="none")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    invoice_number = Column(String(50), nullable=False, unique=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    service = Column(String(255), nullable=False)
    amount_paise = Column(Integer, nullable=False)
    commission_paise = Column(Integer, nullable=False, default=0)
    total_paise = Column(Integer, nullable=False)
    payment_status = Column(String(30), nullable=False, default="pending")
    transaction_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_read_created", "user_id", "is_read", "created_at"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    destination = Column(String(255), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"
    __table_args__ = (Index("ix_emergency_status_city", "status", "city"),)

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    category = Column(String(100), nullable=False)
    urgency = Column(String(30), nullable=False, default="high")
    description = Column(Text, nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False, default="open")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
