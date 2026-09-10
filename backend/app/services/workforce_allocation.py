"""Workforce recommendations derived from forecast quantity and current matching."""

from sqlalchemy.orm import Session

from app.services.matching import WorkforceRequirement, rank_workers_for_requirement


def build_workforce_allocation(db: Session, city: str, skill: str, predicted_demand: int) -> dict:
    requirement = WorkforceRequirement(skill=skill, city=city)
    ranked = rank_workers_for_requirement(requirement, db)
    recommended = ranked[:max(0, predicted_demand)]
    return {
        "city": city,
        "skill": skill,
        "predicted_demand": max(0, predicted_demand),
        "eligible_workers": len(ranked),
        "recommended_worker_count": len(recommended),
        "shortage": max(0, predicted_demand - len(ranked)),
        "recommended_workers": recommended,
    }
