"""Cooperative reporting endpoints backed by the existing users and jobs tables."""

import json
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.user import User
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/cooperative", tags=["Cooperative"])


def _admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cooperative access required")
    return user


def _skills(user: User) -> list[str]:
    try:
        return [str(value).lower().replace(" ", "_") for value in json.loads(user.skills or "[]")]
    except (TypeError, json.JSONDecodeError):
        return []


def _worker_query(db: Session):
    return db.query(User).filter(User.labor_category.isnot(None))


def _forecast(db: Session, days: int = 7) -> list[dict]:
    now = datetime.now(timezone.utc)
    recent_start = now - timedelta(days=30)
    baseline_start = now - timedelta(days=90)
    recent = db.query(Job).filter(Job.created_at >= recent_start).all()
    baseline = db.query(Job).filter(Job.created_at >= baseline_start).count()
    counts = Counter((job.required_skill or job.work_description or "Uncategorized").strip() for job in recent)
    if not counts:
        return []
    daily_factor = days / 30
    confidence = "high" if baseline >= 10 else "medium" if baseline >= 3 else "low"
    return [
        {"skill": skill, "location": "All locations", "forecast_period_days": days,
         "predicted_jobs": max(1, round(count * daily_factor)), "recent_jobs_30d": count,
         "confidence": confidence, "method": "30-day moving average of posted jobs"}
        for skill, count in counts.most_common(12)
    ]


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(_admin)):
    workers = _worker_query(db).all()
    jobs = db.query(Job).all()
    active_statuses = {"posted", "labour_allotted", "work_started", "work_in_progress"}
    revenue = sum((job.platform_commission_paise or 0) for job in jobs) / 100
    return {
        "members": len(workers),
        "verified_workers": sum(1 for worker in workers if worker.email_verified and worker.phone_verified),
        "active_jobs": sum(1 for job in jobs if job.status in active_statuses),
        "cooperative_revenue": revenue,
        "jobs_total": len(jobs),
        "source": "users and jobs database tables",
    }


@router.get("/members")
def members(db: Session = Depends(get_db), _: User = Depends(_admin)):
    return [{
        "id": worker.id, "name": worker.full_name, "email": worker.email, "city": worker.city,
        "skills": _skills(worker), "verified": bool(worker.email_verified and worker.phone_verified),
        "created_at": worker.created_at,
    } for worker in _worker_query(db).order_by(User.created_at.desc()).all()]


@router.get("/demand-forecast")
def demand_forecast(days: int = 7, db: Session = Depends(get_db), _: User = Depends(_admin)):
    if days not in (7, 14, 30):
        raise HTTPException(status_code=400, detail="days must be 7, 14, or 30")
    return {"forecast": _forecast(db, days), "generated_at": datetime.now(timezone.utc)}


@router.get("/workforce")
def workforce(db: Session = Depends(get_db), _: User = Depends(_admin)):
    workers = _worker_query(db).all()
    assigned = {job.allotted_labor_id for job in db.query(Job).filter(Job.allotted_labor_id.isnot(None), Job.status.notin_(["payment_completed", "payout_released"])).all()}
    gaps = []
    for item in _forecast(db, 7):
        key = item["skill"].lower().replace(" ", "_")
        qualified = [worker for worker in workers if key in _skills(worker) or key in (worker.labor_category.value if worker.labor_category else "")]
        available = sum(1 for worker in qualified if worker.id not in assigned)
        required = item["predicted_jobs"]
        gaps.append({**item, "qualified_workers": len(qualified), "available_workers": available,
                     "gap": max(0, required - available), "recommendation":
                     f"Allocate {max(0, required - available)} additional qualified workers" if required > available else "Capacity currently covers forecast"})
    return {"workforce": gaps}


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), _: User = Depends(_admin)):
    jobs = db.query(Job).all()
    completed = [job for job in jobs if job.status in {"work_completed", "payment_completed", "payout_released"}]
    by_category = Counter(str(job.category.value if hasattr(job.category, "value") else job.category) for job in jobs)
    by_city = Counter(job.city for job in jobs)
    return {"jobs_posted": len(jobs), "jobs_completed": len(completed),
            "completion_rate": round(len(completed) / len(jobs) * 100, 1) if jobs else 0,
            "average_job_value": round(sum(job.budget_paise for job in jobs) / len(jobs) / 100, 2) if jobs else 0,
            "jobs_by_category": dict(by_category), "jobs_by_city": dict(by_city)}
