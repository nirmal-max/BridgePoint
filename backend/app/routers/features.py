"""Persisted worker, invoice, notification, wage, and emergency APIs."""

import json
import statistics
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feature import Certification, EmergencyRequest, InsurancePolicy, Invoice, JobLocation, Notification, WelfareRecord, WorkerAvailability, WorkerLocation
from app.models.job import Job
from app.models.user import User, UserRole
from app.models.commission import CommissionLedger
from app.schemas.features import (
    AvailabilityResponse, AvailabilityUpdate, CertificationCreate, CertificationResponse,
    EmergencyCreate, EmergencyResponse, EmergencyStatusUpdate, InsuranceCreate, InsuranceResponse,
    InvoiceResponse, LocationResponse, LocationUpdate, NotificationResponse, ProviderVerificationResponse,
    WelfareResponse, WelfareUpdate,
)
from app.services.websocket_manager import manager
from app.services.trust import calculate_trust_score
from app.utils.deps import get_current_user, require_cooperative, require_labor

router = APIRouter(tags=["Feature Layer"])


def roles(user: User) -> list[str]:
    try:
        return json.loads(user.roles or "[]")
    except (TypeError, json.JSONDecodeError):
        return []


def can_manage_worker(current_user: User, worker_id: int) -> bool:
    return current_user.is_admin or current_user.id == worker_id


def notify(db: Session, user_id: int, kind: str, title: str, body: str, destination: str | None = None) -> Notification:
    item = Notification(user_id=user_id, kind=kind, title=title, body=body, destination=destination)
    db.add(item)
    return item


def availability_response(item: WorkerAvailability | None, worker_id: int) -> AvailabilityResponse:
    if item is None:
        return AvailabilityResponse(worker_id=worker_id, is_available=False, updated_at=datetime.now(timezone.utc))
    return AvailabilityResponse.model_validate(item)


@router.get("/api/workers/me/availability", response_model=AvailabilityResponse)
def get_availability(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    return availability_response(db.query(WorkerAvailability).filter_by(worker_id=current_user.id).first(), current_user.id)


@router.patch("/api/workers/me/availability", response_model=AvailabilityResponse)
def update_availability(payload: AvailabilityUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    item = db.query(WorkerAvailability).filter_by(worker_id=current_user.id).first()
    now = datetime.now(timezone.utc)
    if item is None:
        item = WorkerAvailability(worker_id=current_user.id, is_available=payload.is_available, updated_at=now)
        db.add(item)
    else:
        item.is_available = payload.is_available
        item.updated_at = now
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/workers/me/location", response_model=LocationResponse)
def get_worker_location(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    item = db.query(WorkerLocation).filter_by(worker_id=current_user.id).first()
    if item is None:
        raise HTTPException(404, "Worker location has not been set")
    return item


@router.patch("/api/workers/me/location", response_model=LocationResponse)
def update_worker_location(payload: LocationUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    item = db.query(WorkerLocation).filter_by(worker_id=current_user.id).first()
    now = datetime.now(timezone.utc)
    if item is None:
        item = WorkerLocation(worker_id=current_user.id, **payload.model_dump(), updated_at=now)
        db.add(item)
    else:
        for key, value in payload.model_dump().items():
            setattr(item, key, value)
        item.updated_at = now
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/workers/{worker_id}/availability", response_model=AvailabilityResponse)
def get_public_availability(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Worker not found")
    return availability_response(db.query(WorkerAvailability).filter_by(worker_id=worker_id).first(), worker_id)


def certification_status(item: Certification) -> str:
    if item.verification_status == "VERIFIED" and item.expiry_date and item.expiry_date < date.today():
        return "EXPIRED"
    return item.verification_status


def certification_payload(item: Certification) -> dict:
    return {"id": item.id, "worker_id": item.worker_id, "name": item.name, "issuing_organization": item.issuing_organization, "issue_date": item.issue_date, "expiry_date": item.expiry_date, "verification_status": certification_status(item), "credential_id": item.credential_id, "created_at": item.created_at}


def provider_verification_payload(worker: User) -> dict:
    try:
        skills = json.loads(worker.skills or "[]")
    except (TypeError, json.JSONDecodeError):
        skills = []
    return {
        "worker_id": worker.id,
        "worker_name": worker.full_name,
        "labor_category": worker.labor_category.value if worker.labor_category else None,
        "city": worker.city,
        "skills": skills if isinstance(skills, list) else [],
        "status": worker.provider_verification_status,
    }


@router.get("/api/workers/me/provider-verification", response_model=ProviderVerificationResponse)
def get_provider_verification(
    db: Session = Depends(get_db), current_user: User = Depends(require_labor)
):
    return provider_verification_payload(current_user)


@router.get("/api/cooperative/provider-verification", response_model=list[ProviderVerificationResponse])
def list_provider_verification(
    db: Session = Depends(get_db), current_user: User = Depends(require_cooperative)
):
    workers = db.query(User).filter(
        or_(User.roles.contains('"labor"'), User.labor_category.isnot(None))
    ).order_by(User.full_name.asc()).all()
    return [provider_verification_payload(worker) for worker in workers]


def update_provider_verification(
    worker_id: int, new_status: str, db: Session, current_user: User
) -> dict:
    if current_user.id == worker_id:
        raise HTTPException(403, "Workers cannot verify their own provider status")
    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker or not (UserRole.LABOR.value in roles(worker) or worker.labor_category is not None):
        raise HTTPException(404, "Worker not found")
    worker.provider_verification_status = new_status
    db.commit()
    db.refresh(worker)
    return provider_verification_payload(worker)


@router.post("/api/providers/{worker_id}/verify", response_model=ProviderVerificationResponse)
def verify_provider(
    worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_cooperative)
):
    return update_provider_verification(worker_id, "VERIFIED", db, current_user)


@router.post("/api/providers/{worker_id}/reject", response_model=ProviderVerificationResponse)
def reject_provider(
    worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_cooperative)
):
    return update_provider_verification(worker_id, "REJECTED", db, current_user)


@router.get("/api/workers/me/certifications", response_model=list[CertificationResponse])
def list_certifications(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    return [certification_payload(item) for item in db.query(Certification).filter_by(worker_id=current_user.id).order_by(Certification.created_at.desc()).all()]


@router.get("/api/workers/{worker_id}/certifications", response_model=list[CertificationResponse])
def list_public_certifications(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [certification_payload(item) for item in db.query(Certification).filter(Certification.worker_id == worker_id, Certification.verification_status == "VERIFIED").all()]


@router.get("/api/workers/{worker_id}/trust-score")
def worker_trust_score(worker_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(User).filter(User.id == worker_id).first():
        raise HTTPException(404, "Worker not found")
    return calculate_trust_score(worker_id, db)


@router.post("/api/workers/me/certifications", response_model=CertificationResponse, status_code=201)
def add_certification(payload: CertificationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    if payload.expiry_date and payload.expiry_date < payload.issue_date:
        raise HTTPException(422, "Expiry date cannot be before issue date")
    item = Certification(worker_id=current_user.id, verification_status="SELF_DECLARED", **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return certification_payload(item)


@router.post("/api/certifications/{certification_id}/verify", response_model=CertificationResponse)
def verify_certification(certification_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_cooperative)):
    item = db.query(Certification).filter(Certification.id == certification_id).first()
    if not item:
        raise HTTPException(404, "Certification not found")
    item.verification_status = "VERIFIED"
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return certification_payload(item)


@router.get("/api/cooperative/certifications")
def list_certification_queue(db: Session = Depends(get_db), current_user: User = Depends(require_cooperative)):
    rows = db.query(Certification, User.full_name).join(User, User.id == Certification.worker_id).order_by(Certification.created_at.desc()).all()
    return [{**certification_payload(item), "worker_name": worker_name} for item, worker_name in rows]


@router.get("/api/workers/me/welfare", response_model=list[WelfareResponse])
def list_welfare(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    return db.query(WelfareRecord).filter_by(worker_id=current_user.id).all()


@router.post("/api/workers/me/welfare", response_model=WelfareResponse, status_code=201)
def upsert_welfare(payload: WelfareUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    item = db.query(WelfareRecord).filter_by(worker_id=current_user.id, support_type=payload.support_type).first()
    if item is None:
        item = WelfareRecord(worker_id=current_user.id, **payload.model_dump())
        db.add(item)
    else:
        for key, value in payload.model_dump().items():
            setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/workers/me/insurance", response_model=list[InsuranceResponse])
def list_insurance(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    policies = db.query(InsurancePolicy).filter_by(worker_id=current_user.id).order_by(InsurancePolicy.created_at.desc()).all()
    for policy in policies:
        if policy.expiry_date and policy.expiry_date < date.today() and policy.status == "active":
            policy.status = "expired"
    db.commit()
    return policies


@router.post("/api/workers/me/insurance", response_model=InsuranceResponse, status_code=201)
def add_insurance(payload: InsuranceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    if payload.start_date and payload.expiry_date and payload.expiry_date < payload.start_date:
        raise HTTPException(422, "Expiry date cannot be before start date")
    item = InsurancePolicy(worker_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def invoice_payload(item: Invoice, job: Job, transaction_reference: str | None = None) -> dict:
    return {"id": item.id, "job_id": item.job_id, "job_status": job.status, "invoice_number": item.invoice_number, "employer_id": item.employer_id, "worker_id": item.worker_id, "employer_name": job.employer.full_name if job.employer else "Customer", "worker_name": job.allotted_labor.full_name if job.allotted_labor else None, "service": item.service, "job_date": job.date_of_task, "amount": item.amount_paise / 100, "commission": item.commission_paise / 100, "total": item.total_paise / 100, "payment_status": job.payment_status or item.payment_status, "transaction_reference": transaction_reference or item.transaction_reference, "created_at": item.created_at}


@router.get("/api/invoices/job/{job_id}", response_model=InvoiceResponse)
def get_invoice(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    allowed = current_user.is_admin or current_user.id == job.employer_id or current_user.id == job.allotted_labor_id
    if not allowed:
        raise HTTPException(403, "You cannot access this invoice")
    item = db.query(Invoice).filter_by(job_id=job_id).first()
    ledger = db.query(CommissionLedger).filter_by(job_id=job_id).first()
    if item is None:
        item = Invoice(job_id=job.id, invoice_number=f"BP-{job.id:06d}", employer_id=job.employer_id, worker_id=job.allotted_labor_id, service=job.title, amount_paise=job.budget_paise, commission_paise=job.platform_commission_paise, total_paise=job.employer_total_paise, payment_status=job.payment_status or "pending", transaction_reference=ledger.upi_reference if ledger else None)
        db.add(item)
        db.commit()
        db.refresh(item)
    return invoice_payload(item, job, ledger.upi_reference if ledger else None)


@router.get("/api/notifications", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(100).all()


@router.patch("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not item:
        raise HTTPException(404, "Notification not found")
    item.is_read = True
    db.commit()
    db.refresh(item)
    return item


@router.post("/api/emergency", response_model=EmergencyResponse, status_code=201)
async def create_emergency(payload: EmergencyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if "employer" not in roles(current_user) and not current_user.is_admin:
        raise HTTPException(403, "Customer access required")
    item = EmergencyRequest(customer_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.flush()
    workers = db.query(User).filter(User.city == payload.city).all()
    worker_ids = [worker.id for worker in workers if "labor" in roles(worker) or worker.labor_category]
    for worker_id in worker_ids:
        notify(db, worker_id, "emergency", "Emergency request nearby", f"{payload.category} emergency request in {payload.city}.", "/worker/available-jobs")
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/emergency/mine", response_model=list[EmergencyResponse])
def list_my_emergencies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(EmergencyRequest).filter(or_(EmergencyRequest.customer_id == current_user.id, EmergencyRequest.assigned_worker_id == current_user.id)).order_by(EmergencyRequest.created_at.desc()).all()


@router.get("/api/emergency/open", response_model=list[EmergencyResponse])
def list_open_emergencies(db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    return db.query(EmergencyRequest).filter(EmergencyRequest.status == "open", EmergencyRequest.city == current_user.city).order_by(EmergencyRequest.created_at.desc()).all()


@router.post("/api/emergency/{request_id}/respond", response_model=EmergencyResponse)
async def respond_emergency(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_labor)):
    item = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id, EmergencyRequest.status == "open", EmergencyRequest.city == current_user.city).first()
    if not item:
        raise HTTPException(404, "Emergency request is not available")
    item.assigned_worker_id = current_user.id
    item.status = "responded"
    notify(db, item.customer_id, "emergency", "Worker responded", f"{current_user.full_name} responded to your emergency request.", f"/emergency?request_id={item.id}")
    db.commit()
    db.refresh(item)
    return item


@router.patch("/api/emergency/{request_id}/status", response_model=EmergencyResponse)
def update_emergency_status(request_id: int, payload: EmergencyStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(EmergencyRequest).filter_by(id=request_id).first()
    if not item:
        raise HTTPException(404, "Emergency request not found")
    if current_user.id not in {item.customer_id, item.assigned_worker_id} and not current_user.is_admin:
        raise HTTPException(403, "You cannot update this emergency request")
    if current_user.id == item.customer_id and payload.status not in {"cancelled", "resolved"}:
        raise HTTPException(403, "Customer cannot set this status")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/wage-benchmark")
def wage_benchmark(city: str | None = None, skill: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Job).filter(Job.budget_paise > 0)
    if city:
        query = query.filter(Job.city == city)
    if skill:
        query = query.filter(Job.required_skill.ilike(f"%{skill}%"))
    values = [job.budget_paise / 100 for job in query.all()]
    if not values:
        return {"status": "insufficient_data", "message": "Insufficient BridgePoint data", "sample_size": 0}
    return {"status": "available", "sample_size": len(values), "average": round(statistics.mean(values), 2), "median": round(statistics.median(values), 2), "minimum": min(values), "maximum": max(values), "currency": "INR"}
