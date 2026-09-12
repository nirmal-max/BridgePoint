"""Persisted worker voice onboarding records."""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text, ForeignKey
from app.database import Base

class VoiceOnboarding(Base):
    __tablename__ = "voice_onboardings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    language = Column(String(8), nullable=False)
    transcript = Column(Text, nullable=False)
    profile_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
