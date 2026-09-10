"""Prophet demand forecasting over real BridgePoint job history."""

from datetime import date, datetime, timezone

import pandas as pd
from sqlalchemy.orm import Session

from app.models.job import Job
from app.services.matching import SKILL_TAXONOMY

MIN_HISTORY_DAYS = 14
MAX_FORECAST_DAYS = 30
_IGNORED_STATUSES = {"deleted", "test", "draft"}


def _normalise(value: str | None) -> str:
    return " ".join((value or "").lower().replace("_", " ").split())


def _matches_skill(job: Job, skill: str) -> bool:
    requested = _normalise(skill)
    values = {_normalise(job.required_skill), _normalise(job.work_description), _normalise(job.title)}
    requested_group = next((group for group, aliases in SKILL_TAXONOMY.items() if requested == group or requested in aliases), None)
    accepted = SKILL_TAXONOMY.get(requested_group, {requested}) if requested_group else {requested}
    return bool(requested) and any(value in accepted or value == requested for value in values if value)


def build_demand_history(db: Session, city: str, skill: str) -> pd.DataFrame:
    """Return continuous Prophet input for genuine historical service requests."""
    jobs = (
        db.query(Job)
        .filter(Job.city.ilike(city.strip()))
        .order_by(Job.date_of_task.asc())
        .all()
    )
    today = datetime.now(timezone.utc).date()
    dates: list[date] = []
    for job in jobs:
        task_date = job.date_of_task.date() if isinstance(job.date_of_task, datetime) else job.date_of_task
        if task_date and task_date <= today and job.status not in _IGNORED_STATUSES and _matches_skill(job, skill):
            dates.append(task_date)

    if not dates:
        return pd.DataFrame(columns=["ds", "y"])

    start, end = min(dates), max(dates)
    index = pd.date_range(start=start, end=end, freq="D")
    counts = pd.Series(dates, dtype="datetime64[ns]").value_counts()
    history = pd.DataFrame({"ds": index})
    history["y"] = history["ds"].map(counts).fillna(0).astype(int)
    return history


def forecast_demand(db: Session, city: str, skill: str, days: int = 7) -> dict:
    """Forecast future daily demand, or explicitly report insufficient history."""
    if days < 1 or days > MAX_FORECAST_DAYS:
        raise ValueError(f"days must be between 1 and {MAX_FORECAST_DAYS}")

    history = build_demand_history(db, city, skill)
    history_days = int((history["ds"].max() - history["ds"].min()).days + 1) if not history.empty else 0
    base = {
        "city": city,
        "skill": skill,
        "model": "Prophet",
        "history_days": history_days,
        "minimum_history_days": MIN_HISTORY_DAYS,
    }
    if history_days < MIN_HISTORY_DAYS:
        return {**base, "status": "insufficient_data", "forecast": []}

    try:
        from prophet import Prophet
    except ImportError as exc:
        raise RuntimeError("Prophet is not installed. Install backend requirements before requesting forecasts.") from exc

    model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(history)
    future = model.make_future_dataframe(periods=days, freq="D")
    predicted = model.predict(future).tail(days)
    points = []
    for row in predicted.itertuples(index=False):
        points.append({
            "date": row.ds.date().isoformat(),
            "predicted_demand": max(0, round(float(row.yhat))),
            "lower_bound": max(0, round(float(row.yhat_lower))),
            "upper_bound": max(0, round(float(row.yhat_upper))),
        })
    return {**base, "status": "ok", "forecast": points}
