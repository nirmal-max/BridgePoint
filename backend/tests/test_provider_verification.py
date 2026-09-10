import json
import unittest
from datetime import date

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

import app.main  # noqa: F401 - register all models before metadata creation
from app.main import app
from app.database import Base
from app.models.feature import Certification, WorkerAvailability
from app.models.user import LaborCategory, User
from app.routers.features import reject_provider, verify_provider
from app.services.matching import WorkforceRequirement, rank_workers_for_requirement
from app.utils.deps import require_cooperative
from app.database import get_db
from app.utils.deps import get_current_user


class ProviderVerificationTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.worker = User(
            email="provider@example.com", phone="9110000001", password_hash="x",
            full_name="Verified Worker", roles=json.dumps(["labor"]),
            labor_category=LaborCategory.LABOR, skills=json.dumps(["plumbing"]), city="Chennai",
            provider_verification_status="VERIFIED",
        )
        self.pending = User(
            email="pending@example.com", phone="9110000002", password_hash="x",
            full_name="Pending Worker", roles=json.dumps(["labor"]),
            labor_category=LaborCategory.LABOR, skills=json.dumps(["plumbing"]), city="Chennai",
            provider_verification_status="PENDING",
        )
        self.rejected = User(
            email="rejected@example.com", phone="9110000003", password_hash="x",
            full_name="Rejected Worker", roles=json.dumps(["labor"]),
            labor_category=LaborCategory.LABOR, skills=json.dumps(["plumbing"]), city="Chennai",
            provider_verification_status="REJECTED",
        )
        self.admin = User(
            email="cooperative@example.com", phone="9110000004", password_hash="x",
            full_name="Cooperative Admin", roles=json.dumps(["cooperative"]), is_admin=True,
        )
        self.customer = User(
            email="customer@example.com", phone="9110000005", password_hash="x",
            full_name="Customer", roles=json.dumps(["employer"]),
        )
        self.db.add_all([self.worker, self.pending, self.rejected, self.admin, self.customer])
        self.db.flush()
        self.db.add_all([
            WorkerAvailability(worker_id=self.worker.id, is_available=True),
            WorkerAvailability(worker_id=self.pending.id, is_available=True),
            WorkerAvailability(worker_id=self.rejected.id, is_available=True),
        ])
        self.db.commit()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()
        self.db.close()

    def _override_db(self):
        yield self.db

    def test_registration_sets_new_labor_provider_to_pending(self):
        app.dependency_overrides[get_db] = self._override_db
        response = self.client.post("/api/auth/register", json={
            "email": "new-provider@example.com",
            "phone": "9110000010",
            "password": "password123",
            "full_name": "New Provider",
            "role": "labor",
            "labor_category": "labor",
            "skills": ["plumbing"],
            "city": "Chennai",
        })
        self.assertEqual(response.status_code, 201)
        created = self.db.query(User).filter(User.email == "new-provider@example.com").one()
        self.assertEqual(created.provider_verification_status, "PENDING")

    def test_http_provider_authorization(self):
        app.dependency_overrides[get_db] = self._override_db
        app.dependency_overrides[get_current_user] = lambda: self.admin
        response = self.client.get("/api/cooperative/provider-verification")
        self.assertEqual(response.status_code, 200)
        response = self.client.post(f"/api/providers/{self.pending.id}/verify")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "VERIFIED")

        app.dependency_overrides[get_current_user] = lambda: self.customer
        response = self.client.post(f"/api/providers/{self.rejected.id}/verify")
        self.assertEqual(response.status_code, 403)

        app.dependency_overrides[get_current_user] = lambda: self.worker
        response = self.client.post(f"/api/providers/{self.worker.id}/verify")
        self.assertEqual(response.status_code, 403)

    def test_matching_only_includes_verified_provider(self):
        matches = rank_workers_for_requirement(WorkforceRequirement("plumber", "Chennai"), self.db)
        self.assertEqual([item["worker_id"] for item in matches], [self.worker.id])
        self.assertTrue(matches[0]["provider_verified"])

    def test_cooperative_can_verify_and_reject_but_worker_cannot_self_verify(self):
        verified = verify_provider(self.pending.id, db=self.db, current_user=self.admin)
        self.assertEqual(verified["status"], "VERIFIED")
        rejected = reject_provider(self.worker.id, db=self.db, current_user=self.admin)
        self.assertEqual(rejected["status"], "REJECTED")
        with self.assertRaises(HTTPException) as error:
            verify_provider(self.rejected.id, db=self.db, current_user=self.rejected)
        self.assertEqual(error.exception.status_code, 403)

    def test_non_cooperative_dependency_is_rejected(self):
        with self.assertRaises(HTTPException) as error:
            require_cooperative(self.customer)
        self.assertEqual(error.exception.status_code, 403)

    def test_provider_status_is_independent_from_certification(self):
        certification = Certification(
            worker_id=self.pending.id, name="Plumbing basics", issuing_organization="Worker",
            issue_date=date(2026, 1, 1), verification_status="SELF_DECLARED",
        )
        self.db.add(certification)
        self.db.commit()
        verify_provider(self.pending.id, db=self.db, current_user=self.admin)
        self.db.refresh(certification)
        self.assertEqual(certification.verification_status, "SELF_DECLARED")


if __name__ == "__main__":
    unittest.main()
