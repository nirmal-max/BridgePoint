"""Cooperative-only demand forecasting and workforce planning APIs."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.demand_forecasting import MAX_FORECAST_DAYS, forecast_demand
from app.services.workforce_allocation import build_workforce_allocation
from app.utils.deps import get_current_user, require_cooperative

router = APIRouter(prefix="/api/forecast", tags=["Forecasting"])


@router.get("/demand")
def demand(
    city: str = Query(..., min_length=1, max_length=100),
    skill: str = Query(..., min_length=1, max_length=100),
    days: int = Query(default=7, ge=1, le=MAX_FORECAST_DAYS),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        return forecast_demand(db, city, skill, days)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/workforce")
def workforce(
    city: str = Query(..., min_length=1, max_length=100),
    skill: str = Query(..., min_length=1, max_length=100),
    target_date: date | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    _: User = Depends(require_cooperative),
):
    requested_date = target_date or (datetime.now(timezone.utc).date() + timedelta(days=1))
    horizon = (requested_date - datetime.now(timezone.utc).date()).days + 1
    if horizon < 1 or horizon > MAX_FORECAST_DAYS:
        raise HTTPException(status_code=400, detail=f"date must be within the next {MAX_FORECAST_DAYS} days")
    try:
        forecast = forecast_demand(db, city, skill, horizon)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if forecast["status"] != "ok":
        return {**forecast, "date": requested_date.isoformat(), "allocation": None}
    point = next((item for item in forecast["forecast"] if item["date"] == requested_date.isoformat()), None)
    if point is None:
        raise HTTPException(status_code=404, detail="Forecast date is not available")
    allocation = build_workforce_allocation(db, city, skill, point["predicted_demand"])
    return {"status": "ok", "date": requested_date.isoformat(), "forecast": point, "allocation": allocation}
