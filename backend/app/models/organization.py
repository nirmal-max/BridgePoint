"""Federation, society, and cooperative membership records."""

from datetime import datetime, timezone
import enum

from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class OrganizationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class MembershipStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class MembershipType(str, enum.Enum):
    WORKER = "worker"
    STAFF = "staff"
    COMMITTEE = "committee"


class Federation(Base):
    __tablename__ = "federations"
    __table_args__ = (Index("ix_federations_status", "status"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    status = Column(SAEnum(OrganizationStatus), default=OrganizationStatus.PENDING, nullable=False)
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    societies = relationship("Society", back_populates="federation", cascade="all, delete-orphan")


class Society(Base):
    __tablename__ = "societies"
    __table_args__ = (Index("ix_societies_federation_status", "federation_id", "status"),)

    id = Column(Integer, primary_key=True, index=True)
    federation_id = Column(Integer, ForeignKey("federations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    status = Column(SAEnum(OrganizationStatus), default=OrganizationStatus.PENDING, nullable=False)
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    federation = relationship("Federation", back_populates="societies")
    memberships = relationship("CooperativeMembership", back_populates="society", cascade="all, delete-orphan")


class CooperativeMembership(Base):
    __tablename__ = "cooperative_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "society_id", name="uq_membership_user_society"),
        Index("ix_memberships_society_status", "society_id", "status"),
        Index("ix_memberships_user_status", "user_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    society_id = Column(Integer, ForeignKey("societies.id", ondelete="CASCADE"), nullable=False, index=True)
    membership_number = Column(String(100), unique=True, nullable=False, index=True)
    membership_type = Column(SAEnum(MembershipType), default=MembershipType.WORKER, nullable=False)
    status = Column(SAEnum(MembershipStatus), default=MembershipStatus.PENDING, nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    society = relationship("Society", back_populates="memberships")
    user = relationship("User", foreign_keys=[user_id])
    verifier = relationship("User", foreign_keys=[verified_by])
