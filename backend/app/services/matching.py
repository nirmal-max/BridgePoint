"""Deterministic, explainable worker matching for BridgePoint jobs."""

import json
from dataclasses import dataclass
from math import atan2, cos, radians, sin, sqrt

from sqlalchemy.orm import Session

from app.models.feature import Certification, WorkerAvailability, WorkerLocation
from app.models.job import Job
from app.models.review import Review
from app.models.user import User, UserRole
from app.services.trust import calculate_trust_score


@dataclass(frozen=True)
class WorkforceRequirement:
    skill: str
    city: str
    latitude: float | None = None
    longitude: float | None = None

SKILL_TAXONOMY = {
    "electrician": {"electrician", "electrical", "electrical repair", "electric wiring", "wiring"},
    "plumber": {"plumber", "plumbing", "pipe fitting", "pipe repair", "water pipe"},
    "carpenter": {"carpenter", "carpentry", "woodwork", "furniture repair"},
    "painter": {"painter", "painting", "wall painting"},
    "cleaner": {"cleaner", "cleaning", "house cleaning", "deep cleaning"},
    "driver": {"driver", "driving", "delivery rider", "delivery"},
    "caregiver": {"caregiver", "care work", "elder care", "child care"},
}


def _normalise(value: str | None) -> str:
    return " ".join((value or "").lower().replace("_", " ").split())


def _skills(user: User) -> list[str]:
    try:
        values = json.loads(user.skills or "[]")
    except (TypeError, json.JSONDecodeError):
        values = []
    return [_normalise(str(value)) for value in values]


def _roles(user: User) -> list[str]:
    try:
        return json.loads(user.roles or "[]")
    except (TypeError, json.JSONDecodeError):
        return []


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance without requiring a GIS database extension."""
    radius_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    value = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return radius_km * (2 * atan2(sqrt(value), sqrt(max(0.0, 1 - value))))


def _skill_score_for_values(values: list[str], requested_skill: str | None) -> float:
    requested = _normalise(requested_skill)
    if not requested:
        return 0.0
    requested_group = next((group for group, aliases in SKILL_TAXONOMY.items() if requested in aliases or group in requested), None)
    best = 0.0
    for skill in values:
        skill = _normalise(skill)
        if skill == requested:
            best = max(best, 1.0)
        elif requested_group and (skill == requested_group or skill in SKILL_TAXONOMY[requested_group]):
            best = max(best, 0.8)
    return best


def _skill_score_for_request(user: User, requested_skill: str | None) -> float:
    return _skill_score_for_values(_skills(user), requested_skill)


def _skill_score(user: User, job: Job) -> float:
    work_description = job.work_description.value if hasattr(job.work_description, "value") else str(job.work_description)
    return _skill_score_for_request(user, job.required_skill or work_description)


def _is_labor(user: User) -> bool:
    return UserRole.LABOR.value in _roles(user) or user.labor_category is not None


def _rating_score(user: User, db: Session) -> float:
    ratings = [row[0] for row in db.query(Review.rating).filter(Review.reviewee_id == user.id).all()]
    return (sum(ratings) / len(ratings) / 5.0) if ratings else 0.5


def _reliability_score(user: User, db: Session) -> float:
    total = db.query(Job).filter(Job.allotted_labor_id == user.id).count()
    completed = db.query(Job).filter(Job.allotted_labor_id == user.id, Job.status.in_(["work_completed", "payment_completed", "payout_released"])).count()
    return completed / total if total else 0.5


def _score_worker_signals(worker: User, requested_skill: str | None, city: str | None, latitude: float | None, longitude: float | None, db: Session, require_coordinates: bool = False) -> dict | None:
    if not _is_labor(worker):
        return None
    if worker.provider_verification_status != "VERIFIED":
        return None
    if city and _normalise(worker.city) != _normalise(city):
        return None
    availability = db.query(WorkerAvailability).filter_by(worker_id=worker.id).first()
    if availability is not None and not availability.is_available:
        return None
    skill_score = _skill_score_for_request(worker, requested_skill)
    if skill_score <= 0:
        return None

    location = db.query(WorkerLocation).filter_by(worker_id=worker.id).first() if latitude is not None and longitude is not None else None
    distance_km = None
    radius_km = 10.0
    distance_score = 0.5
    if latitude is not None and longitude is not None and location:
        distance_km = calculate_distance_km(location.latitude, location.longitude, latitude, longitude)
        if distance_km > radius_km:
            return None
        distance_score = max(0.0, 1 - distance_km / max(radius_km, 0.1))
    elif require_coordinates:
        return None

    required = _normalise(requested_skill)
    verified_certifications = db.query(Certification).filter(
        Certification.worker_id == worker.id,
        Certification.verification_status == "VERIFIED",
    ).all()
    verified_certification = 1.0 if not required else (
        1.0 if any(_skill_score_for_values([certification.name], requested_skill) > 0 for certification in verified_certifications)
        else 0.0
    )
    rating_score = _rating_score(worker, db)
    reliability_score = _reliability_score(worker, db)
    recent_jobs = db.query(Job).filter(Job.allotted_labor_id == worker.id).count()
    workload_score = max(0.0, 1 - min(recent_jobs / 10.0, 1.0))
    fairness_score = workload_score
    trust = calculate_trust_score(worker.id, db)
    trust_score = trust["trust_score"] / 100
    score = skill_score * 0.30 + distance_score * 0.20 + 1.0 * 0.10 + verified_certification * 0.10 + rating_score * 0.10 + reliability_score * 0.05 + workload_score * 0.05 + fairness_score * 0.05 + trust_score * 0.05
    return {
        "worker_id": worker.id,
        "name": worker.full_name,
        "score": round(score, 4),
        "match_score": round(score * 100, 1),
        "distance_km": round(distance_km, 2) if distance_km is not None else None,
        "available": True,
        "rating": round(rating_score * 5, 2),
        "certified": verified_certification == 1.0,
        "skill_score": round(skill_score, 3),
        "reliability_score": round(reliability_score, 3),
        "workload_score": round(workload_score, 3),
        "fairness_score": round(fairness_score, 3),
        "trust_score": trust["trust_score"],
        "trust_confidence": trust["confidence"],
        "trust_evidence_count": trust["evidence_count"],
        "provider_verified": True,
    }


def score_worker(worker: User, job: Job, db: Session) -> dict | None:
    latitude = job.location.latitude if job.location else None
    longitude = job.location.longitude if job.location else None
    work_description = job.work_description.value if hasattr(job.work_description, "value") else str(job.work_description)
    return _score_worker_signals(worker, job.required_skill or work_description, None, latitude, longitude, db, require_coordinates=job.location is not None)


def rank_workers(job: Job, db: Session) -> list[dict]:
    workers = db.query(User).all()
    ranked = [result for worker in workers if (result := score_worker(worker, job, db)) is not None]
    return sorted(ranked, key=lambda item: item["score"], reverse=True)


def rank_workers_for_requirement(requirement: WorkforceRequirement, db: Session) -> list[dict]:
    """Rank real available workers without creating a synthetic Job row."""
    ranked = [
        result
        for worker in db.query(User).all()
        if (result := _score_worker_signals(
            worker,
            requirement.skill,
            requirement.city,
            requirement.latitude,
            requirement.longitude,
            db,
            require_coordinates=requirement.latitude is not None or requirement.longitude is not None,
        )) is not None
    ]
    return sorted(ranked, key=lambda item: item["score"], reverse=True)


def find_matching_labors(job: Job, db: Session) -> list[User]:
    ranked_ids = [item["worker_id"] for item in rank_workers(job, db)]
    if not ranked_ids:
        return []
    workers = {worker.id: worker for worker in db.query(User).filter(User.id.in_(ranked_ids)).all()}
    return [workers[worker_id] for worker_id in ranked_ids]


def find_matching_jobs(labor: User, db: Session) -> list[Job]:
    if not _is_labor(labor):
        return []
    return [job for job in db.query(Job).filter(Job.status.in_(["posted", "waiting"])).all() if score_worker(labor, job, db)]
