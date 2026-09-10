import json
import unittest
import asyncio
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

import app.main  # noqa: F401 - register all models before metadata creation
from app.main import app
from app.database import Base
from app.models.feature import Certification, WorkerAvailability
from app.models.job import Job, JobCategory, LocationType, OrganizationType, TimeSpan
from app.models.organization import CooperativeMembership, Federation, MembershipStatus, Society
from app.models.user import LaborCategory, User
from app.routers.features import reject_provider, verify_provider
from app.routers.jobs import accept_task
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
        self.cooperative = User(
            email="society@example.com", phone="9110000006", password_hash="x",
            full_name="Society Admin", roles=json.dumps(["cooperative"]),
        )
        self.customer = User(
            email="customer@example.com", phone="9110000005", password_hash="x",
            full_name="Customer", roles=json.dumps(["employer"]),
        )
        self.db.add_all([self.worker, self.pending, self.rejected, self.admin, self.customer, self.cooperative])
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

    def test_public_cooperative_registration_is_rejected(self):
        app.dependency_overrides[get_db] = self._override_db
        response = self.client.post("/api/auth/register", json={
            "email": "new-cooperative@example.com",
            "phone": "9110000011",
            "password": "password123",
            "full_name": "New Cooperative",
            "role": "cooperative",
        })
        self.assertEqual(response.status_code, 403)
        self.assertIsNone(self.db.query(User).filter(User.email == "new-cooperative@example.com").first())

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

    def test_verified_certificate_must_match_requested_skill(self):
        self.db.add(Certification(
            worker_id=self.worker.id, name="Painting safety", issuing_organization="Worker",
            issue_date=date(2026, 1, 1), verification_status="VERIFIED",
        ))
        self.db.commit()
        matches = rank_workers_for_requirement(WorkforceRequirement("plumber", "Chennai"), self.db)
        self.assertFalse(matches[0]["certified"])

    def test_cooperative_can_verify_and_reject_but_worker_cannot_self_verify(self):
        verified = verify_provider(self.pending.id, db=self.db, current_user=self.admin)
        self.assertEqual(verified["status"], "VERIFIED")
        rejected = reject_provider(self.worker.id, db=self.db, current_user=self.admin)
        self.assertEqual(rejected["status"], "REJECTED")
        with self.assertRaises(HTTPException) as error:
            verify_provider(self.rejected.id, db=self.db, current_user=self.rejected)
        self.assertEqual(error.exception.status_code, 403)

    def test_regular_cooperative_is_limited_to_its_members(self):
        with self.assertRaises(HTTPException) as error:
            verify_provider(self.pending.id, db=self.db, current_user=self.cooperative)
        self.assertEqual(error.exception.status_code, 403)

        federation = Federation(name="Test Federation", admin_user_id=self.cooperative.id)
        self.db.add(federation)
        self.db.flush()
        society = Society(name="Test Society", federation_id=federation.id, admin_user_id=self.cooperative.id)
        self.db.add(society)
        self.db.flush()
        self.db.add(CooperativeMembership(
            user_id=self.pending.id, society_id=society.id, membership_number="TEST-001",
            status=MembershipStatus.PENDING,
        ))
        self.db.commit()
        verified = verify_provider(self.pending.id, db=self.db, current_user=self.cooperative)
        self.assertEqual(verified["status"], "VERIFIED")

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

    def test_unverified_provider_cannot_bypass_matching_when_accepting(self):
        job = Job(
            employer_id=self.customer.id,
            title="Plumbing request",
            category=JobCategory.HOUSEHOLD,
            work_description="plumbing",
            role_description="Repair a leaking pipe",
            required_skill="plumber",
            city="Chennai",
            location_type=LocationType.OFFLINE,
            date_of_task=datetime.now(timezone.utc) + timedelta(days=1),
            time_span=TimeSpan.FEW_HOURS,
            organization_type=OrganizationType.INDIVIDUAL,
            budget_paise=10000,
            status="posted",
        )
        self.db.add(job)
        self.db.commit()
        with self.assertRaises(HTTPException) as error:
            asyncio.run(accept_task(job.id, db=self.db, current_user=self.pending))
        self.assertEqual(error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
