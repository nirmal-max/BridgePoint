"""Cooperative reporting endpoints backed by the existing users and jobs tables."""

import json
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.user import User
from app.services.demand_forecasting import forecast_demand
from app.services.workforce_allocation import build_workforce_allocation
from app.utils.deps import require_cooperative

router = APIRouter(prefix="/api/cooperative", tags=["Cooperative"])


def _admin(user: User = Depends(require_cooperative)) -> User:
    return user


def _skills(user: User) -> list[str]:
    try:
        return [str(value).lower().replace(" ", "_") for value in json.loads(user.skills or "[]")]
    except (TypeError, json.JSONDecodeError):
        return []


def _worker_query(db: Session):
    return db.query(User).filter(or_(User.labor_category.isnot(None), User.roles.contains('"labor"')))


def _forecast(db: Session, days: int = 7, location: str | None = None) -> list[dict]:
    pairs = db.query(Job.required_skill, Job.work_description, Job.city).all()
    unique_pairs = {
        ((skill or description or "Uncategorized").strip(), (city or "Unknown").strip())
        for skill, description, city in pairs
    }
    rows = []
    for skill, city in sorted(unique_pairs):
        if location and city.lower() != location.strip().lower():
            continue
        result = forecast_demand(db, city, skill, days)
        if result["status"] != "ok":
            continue
        recent_start = datetime.now(timezone.utc) - timedelta(days=30)
        recent_jobs = db.query(Job).filter(
            Job.created_at >= recent_start,
            Job.city == city,
            or_(Job.required_skill == skill, Job.work_description == skill),
        ).count()
        history_days = result["history_days"]
        confidence = "high" if history_days >= 90 else "medium" if history_days >= 30 else "low"
        rows.append({
            "skill": skill,
            "location": city,
            "forecast_period_days": days,
            "predicted_jobs": sum(point["predicted_demand"] for point in result["forecast"]),
            "recent_jobs_30d": recent_jobs,
            "confidence": confidence,
            "method": "Prophet historical demand forecast",
        })
    return rows[:12]


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(_admin)):
    workers = _worker_query(db).all()
    jobs = db.query(Job).all()
    active_statuses = {"posted", "labour_allotted", "work_started", "work_in_progress"}
    revenue = sum((job.platform_commission_paise or 0) for job in jobs) / 100
    return {
        "members": len(workers),
        "verified_workers": sum(1 for worker in workers if worker.provider_verification_status == "VERIFIED"),
        "active_jobs": sum(1 for job in jobs if job.status in active_statuses),
        "cooperative_revenue": revenue,
        "jobs_total": len(jobs),
        "source": "users and jobs database tables",
    }


@router.get("/members")
def members(db: Session = Depends(get_db), _: User = Depends(_admin)):
    return [{
        "id": worker.id, "name": worker.full_name, "email": worker.email, "city": worker.city,
        "skills": _skills(worker), "verified": worker.provider_verification_status == "VERIFIED",
        "created_at": worker.created_at,
    } for worker in _worker_query(db).order_by(User.created_at.desc()).all()]


@router.get("/demand-forecast")
def demand_forecast(days: int = 7, location: str | None = None, db: Session = Depends(get_db), _: User = Depends(_admin)):
    if days not in (7, 14, 30):
        raise HTTPException(status_code=400, detail="days must be 7, 14, or 30")
    return {"forecast": _forecast(db, days, location), "location": location or "All locations", "generated_at": datetime.now(timezone.utc)}


@router.get("/workforce")
def workforce(db: Session = Depends(get_db), _: User = Depends(_admin)):
    gaps = []
    for item in _forecast(db, 7):
        allocation = build_workforce_allocation(db, item["location"], item["skill"], item["predicted_jobs"])
        gaps.append({
            **item,
            "qualified_workers": allocation["eligible_workers"],
            "available_workers": allocation["recommended_worker_count"],
            "gap": allocation["shortage"],
            "recommendation": (
                f"Allocate {allocation['shortage']} additional qualified workers"
                if allocation["shortage"] else "Capacity currently covers forecast"
            ),
        })
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
