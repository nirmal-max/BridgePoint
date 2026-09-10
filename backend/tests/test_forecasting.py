import json
import sys
import unittest
from unittest import mock
from datetime import datetime, timedelta, timezone
from types import ModuleType

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.main  # noqa: F401 - registers every model before metadata creation
from app.database import Base
from app.models.feature import WorkerAvailability
from app.models.job import Job, JobCategory, LocationType, OrganizationType, TimeSpan
from app.models.user import LaborCategory, User
from app.services.demand_forecasting import build_demand_history, forecast_demand
from app.services.workforce_allocation import build_workforce_allocation


class FakeProphet:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def fit(self, history):
        self.history = history
        return self

    def make_future_dataframe(self, periods, freq):
        return pd.DataFrame({"ds": pd.date_range(self.history["ds"].max(), periods=periods + 1, freq=freq)})

    def predict(self, future):
        return pd.DataFrame({"ds": future["ds"], "yhat": [-2.0] * len(future), "yhat_lower": [-3.0] * len(future), "yhat_upper": [4.0] * len(future)})


class ForecastingTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        employer = User(email="test-employer@example.com", phone="9100000001", password_hash="x", full_name="Employer", roles=json.dumps(["employer"]))
        worker = User(email="test-worker@example.com", phone="9100000002", password_hash="x", full_name="Plumber", roles=json.dumps(["labor"]), labor_category=LaborCategory.LABOR, skills=json.dumps(["plumbing"]), city="Chennai")
        other = User(email="test-other@example.com", phone="9100000003", password_hash="x", full_name="Electrician", roles=json.dumps(["labor"]), labor_category=LaborCategory.LABOR, skills=json.dumps(["electrical"]), city="Chennai")
        self.db.add_all([employer, worker, other])
        self.db.flush()
        self.employer = employer
        self.worker = worker
        self.other = other
        now = datetime.now(timezone.utc)
        for offset in (14, 0):
            self.db.add(Job(employer_id=employer.id, title="Plumbing request", category=JobCategory.HOUSEHOLD, work_description="plumbing", role_description="Need plumbing work", required_skill="plumber", city="Chennai", location_type=LocationType.OFFLINE, address="Test address", date_of_task=now - timedelta(days=offset), time_span=TimeSpan.FEW_HOURS, organization_type=OrganizationType.INDIVIDUAL, budget_paise=10000, status="cancelled"))
        self.db.add_all([WorkerAvailability(worker_id=worker.id, is_available=True), WorkerAvailability(worker_id=other.id, is_available=True)])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_history_aliases_and_missing_dates(self):
        history = build_demand_history(self.db, "Chennai", "plumber")
        self.assertEqual(len(history), 15)
        self.assertEqual(int(history["y"].sum()), 2)
        self.assertEqual(int((history["y"] == 0).sum()), 13)
        self.assertEqual(build_demand_history(self.db, "Other city", "plumber").empty, True)

    def test_insufficient_data_is_explicit(self):
        self.assertEqual(forecast_demand(self.db, "Other city", "plumber")["status"], "insufficient_data")

    def test_mocked_prophet_and_allocation_are_bounded(self):
        module = ModuleType("prophet")
        module.Prophet = FakeProphet
        with mock.patch.dict(sys.modules, {"prophet": module}):
            result = forecast_demand(self.db, "Chennai", "plumbing", 3)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(len(result["forecast"]), 3)
        self.assertTrue(all(item["predicted_demand"] >= 0 and item["lower_bound"] >= 0 for item in result["forecast"]))
        allocation = build_workforce_allocation(self.db, "Chennai", "plumber", 1)
        self.assertEqual(allocation["eligible_workers"], 1)
        self.assertLessEqual(allocation["recommended_worker_count"], 1)
        self.assertEqual(len(self.db.query(Job).all()), 2)


if __name__ == "__main__":
    unittest.main()
