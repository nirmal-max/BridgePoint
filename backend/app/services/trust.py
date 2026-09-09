"""Explainable worker trust metrics derived only from BridgePoint records."""

from sqlalchemy.orm import Session

from app.models.feature import Certification
from app.models.job import Job
from app.models.review import Review


def calculate_trust_score(worker_id: int, db: Session) -> dict:
    assigned = db.query(Job).filter(Job.allotted_labor_id == worker_id).all()
    completed_statuses = {"work_completed", "payment_in_process", "verification_pending", "verified", "payout_released", "payment_completed"}
    completed = [job for job in assigned if job.status in completed_statuses]
    cancelled = [job for job in assigned if job.status in {"cancelled", "expired", "disputed"}]
    ratings = [row[0] for row in db.query(Review.rating).filter(Review.reviewee_id == worker_id).all()]
    verified = db.query(Certification).filter(Certification.worker_id == worker_id, Certification.verification_status == "VERIFIED").count()
    completion_score = len(completed) / len(assigned) if assigned else 0.5
    rating_score = (sum(ratings) / len(ratings) / 5) if ratings else 0.5
    cancellation_score = 1 - len(cancelled) / len(assigned) if assigned else 1.0
    certification_score = 1.0 if verified else 0.5
    score = completion_score * 0.35 + rating_score * 0.30 + cancellation_score * 0.20 + certification_score * 0.15
    evidence_count = len(assigned) + len(ratings) + verified
    confidence = "high" if evidence_count >= 10 else "medium" if evidence_count else "low"
    return {"worker_id": worker_id, "trust_score": round(score * 100, 1), "confidence": confidence, "evidence_count": evidence_count, "completed_jobs": len(completed), "assigned_jobs": len(assigned), "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else None, "verified_certifications": verified, "completion_rate": round(completion_score * 100, 1), "cancellation_rate": round((len(cancelled) / len(assigned)) * 100, 1) if assigned else 0, "method": "BridgePoint jobs, reviews, cancellations, and verified certifications"}
