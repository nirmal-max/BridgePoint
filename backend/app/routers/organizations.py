"""Federation, society, and cooperative membership APIs."""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.organization import Federation, Society, CooperativeMembership, MembershipStatus, MembershipType, OrganizationStatus
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, MembershipCreate, MembershipUpdate, iso
from app.utils.deps import get_current_user, require_cooperative

router = APIRouter(tags=["Organizations"])


def roles(user: User) -> list[str]:
    import json
    try:
        return json.loads(user.roles or "[]")
    except (TypeError, ValueError):
        return []


def can_manage(user: User, owner_id: int | None) -> bool:
    return user.is_admin or "cooperative" in roles(user) and owner_id == user.id


def federation_out(item: Federation) -> dict:
    return {"id": item.id, "name": item.name, "registration_number": item.registration_number, "description": item.description, "state": item.state, "district": item.district, "city": item.city, "address": item.address, "contact_email": item.contact_email, "contact_phone": item.contact_phone, "status": item.status.value, "admin_user_id": item.admin_user_id, "created_at": iso(item.created_at), "updated_at": iso(item.updated_at), "society_count": len(item.societies), "member_count": sum(len(s.memberships) for s in item.societies), "verified_member_count": sum(1 for s in item.societies for m in s.memberships if m.status == MembershipStatus.ACTIVE), "active_member_count": sum(1 for s in item.societies for m in s.memberships if m.status == MembershipStatus.ACTIVE), "pending_member_count": sum(1 for s in item.societies for m in s.memberships if m.status == MembershipStatus.PENDING)}


def society_out(item: Society) -> dict:
    return {"id": item.id, "federation_id": item.federation_id, "federation_name": item.federation.name if item.federation else None, "name": item.name, "registration_number": item.registration_number, "description": item.description, "state": item.state, "district": item.district, "city": item.city, "address": item.address, "contact_email": item.contact_email, "contact_phone": item.contact_phone, "status": item.status.value, "admin_user_id": item.admin_user_id, "created_at": iso(item.created_at), "updated_at": iso(item.updated_at), "member_count": len(item.memberships), "verified_member_count": sum(1 for m in item.memberships if m.status == MembershipStatus.ACTIVE)}


def membership_out(item: CooperativeMembership) -> dict:
    return {"id": item.id, "user_id": item.user_id, "worker_name": item.user.full_name if item.user else None, "worker_email": item.user.email if item.user else None, "society_id": item.society_id, "society_name": item.society.name if item.society else None, "federation_id": item.society.federation_id if item.society else None, "membership_number": item.membership_number, "membership_type": item.membership_type.value, "status": item.status.value, "joined_at": iso(item.joined_at), "verified_at": iso(item.verified_at), "verified_by": item.verified_by}


def get_federation(db: Session, federation_id: int) -> Federation:
    item = db.query(Federation).filter(Federation.id == federation_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Federation not found")
    return item


def get_society(db: Session, society_id: int) -> Society:
    item = db.query(Society).filter(Society.id == society_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Society not found")
    return item


def ensure_manage(user: User, owner_id: int | None) -> None:
    if not can_manage(user, owner_id):
        raise HTTPException(status_code=403, detail="You are not authorized to manage this organization")


@router.get("/api/federations")
def list_federations(db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    query = db.query(Federation)
    if not user.is_admin:
        query = query.filter(Federation.admin_user_id == user.id)
    return [federation_out(item) for item in query.order_by(Federation.created_at.desc()).all()]


@router.post("/api/federations", status_code=201)
def create_federation(payload: OrganizationCreate, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    item = Federation(**payload.model_dump(), admin_user_id=user.id, status=OrganizationStatus.ACTIVE)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Federation registration number already exists")
    db.refresh(item)
    return federation_out(item)


@router.get("/api/federations/{federation_id}")
def get_federation_detail(federation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = get_federation(db, federation_id)
    if not user.is_admin and item.admin_user_id != user.id:
        member = db.query(CooperativeMembership).join(Society).filter(Society.federation_id == federation_id, CooperativeMembership.user_id == user.id).first()
        if not member:
            raise HTTPException(status_code=403, detail="Federation access required")
    return federation_out(item)


@router.patch("/api/federations/{federation_id}")
def update_federation(federation_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    item = get_federation(db, federation_id)
    ensure_manage(user, item.admin_user_id)
    values = payload.model_dump(exclude_unset=True)
    if "status" in values:
        try: values["status"] = OrganizationStatus(values["status"])
        except ValueError: raise HTTPException(status_code=422, detail="Invalid federation status")
    for key, value in values.items(): setattr(item, key, value)
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="Federation registration number already exists")
    db.refresh(item)
    return federation_out(item)


@router.get("/api/societies")
def list_societies(federation_id: int | None = Query(default=None), search: str | None = Query(default=None), status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    query = db.query(Society)
    if not user.is_admin:
        query = query.join(Federation).filter((Society.admin_user_id == user.id) | (Federation.admin_user_id == user.id))
    if federation_id: query = query.filter(Society.federation_id == federation_id)
    if search: query = query.filter(Society.name.ilike(f"%{search.strip()}%"))
    if status_filter:
        try: query = query.filter(Society.status == OrganizationStatus(status_filter))
        except ValueError: raise HTTPException(status_code=422, detail="Invalid society status")
    return [society_out(item) for item in query.order_by(Society.created_at.desc()).all()]


@router.post("/api/societies", status_code=201)
def create_society(payload: OrganizationCreate, federation_id: int = Query(..., gt=0), db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    federation = get_federation(db, federation_id)
    ensure_manage(user, federation.admin_user_id)
    item = Society(**payload.model_dump(), federation_id=federation_id, admin_user_id=user.id, status=OrganizationStatus.ACTIVE)
    db.add(item)
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="Society registration number already exists")
    db.refresh(item)
    return society_out(item)


@router.get("/api/societies/{society_id}")
def get_society_detail(society_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = get_society(db, society_id)
    if not user.is_admin and item.admin_user_id != user.id and item.federation.admin_user_id != user.id:
        member = db.query(CooperativeMembership).filter(CooperativeMembership.society_id == society_id, CooperativeMembership.user_id == user.id).first()
        if not member: raise HTTPException(status_code=403, detail="Society access required")
    return society_out(item)


@router.patch("/api/societies/{society_id}")
def update_society(society_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    item = get_society(db, society_id)
    ensure_manage(user, item.admin_user_id or item.federation.admin_user_id)
    values = payload.model_dump(exclude_unset=True)
    if "status" in values:
        try: values["status"] = OrganizationStatus(values["status"])
        except ValueError: raise HTTPException(status_code=422, detail="Invalid society status")
    for key, value in values.items(): setattr(item, key, value)
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="Society registration number already exists")
    db.refresh(item)
    return society_out(item)


@router.get("/api/societies/{society_id}/members")
def list_members(society_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = get_society(db, society_id)
    if not user.is_admin and item.admin_user_id != user.id and item.federation.admin_user_id != user.id:
        if not db.query(CooperativeMembership).filter(CooperativeMembership.society_id == society_id, CooperativeMembership.user_id == user.id).first(): raise HTTPException(status_code=403, detail="Society access required")
    return [membership_out(m) for m in item.memberships]


def membership_number(society_id: int) -> str:
    return f"BP-{society_id}-{datetime.now(timezone.utc).year}-{secrets.token_hex(3).upper()}"


@router.post("/api/societies/{society_id}/members", status_code=201)
def add_member(society_id: int, payload: MembershipCreate, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    society = get_society(db, society_id)
    ensure_manage(user, society.admin_user_id or society.federation.admin_user_id)
    worker = db.query(User).filter(User.id == payload.user_id).first()
    if not worker or ("labor" not in roles(worker) and not worker.labor_category): raise HTTPException(status_code=422, detail="An existing worker account is required")
    try: membership_type = MembershipType(payload.membership_type)
    except ValueError: raise HTTPException(status_code=422, detail="Invalid membership type")
    if db.query(CooperativeMembership).filter(CooperativeMembership.user_id == payload.user_id, CooperativeMembership.society_id == society_id).first(): raise HTTPException(status_code=409, detail="Worker is already a member of this society")
    item = CooperativeMembership(user_id=payload.user_id, society_id=society_id, membership_number=payload.membership_number or membership_number(society_id), membership_type=membership_type, status=MembershipStatus.PENDING)
    db.add(item)
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail="Membership number already exists")
    db.refresh(item)
    return membership_out(item)


@router.get("/api/memberships/me")
def my_memberships(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [membership_out(m) for m in db.query(CooperativeMembership).filter(CooperativeMembership.user_id == user.id).all()]


@router.get("/api/memberships/{membership_id}")
def get_membership(membership_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(CooperativeMembership).filter(CooperativeMembership.id == membership_id).first()
    if not item: raise HTTPException(status_code=404, detail="Membership not found")
    if not user.is_admin and item.user_id != user.id and not can_manage(user, item.society.admin_user_id or item.society.federation.admin_user_id): raise HTTPException(status_code=403, detail="Membership access required")
    return membership_out(item)


@router.post("/api/memberships/{membership_id}/verify")
def verify_membership(membership_id: int, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    return _change_membership(membership_id, MembershipStatus.ACTIVE, db, user)


@router.post("/api/memberships/{membership_id}/suspend")
def suspend_membership(membership_id: int, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    return _change_membership(membership_id, MembershipStatus.SUSPENDED, db, user)


@router.patch("/api/memberships/{membership_id}")
def update_membership(membership_id: int, payload: MembershipUpdate, db: Session = Depends(get_db), user: User = Depends(require_cooperative)):
    try: target = MembershipStatus(payload.status)
    except ValueError: raise HTTPException(status_code=422, detail="Invalid membership status")
    return _change_membership(membership_id, target, db, user)


def _change_membership(membership_id: int, target: MembershipStatus, db: Session, user: User) -> dict:
    item = db.query(CooperativeMembership).filter(CooperativeMembership.id == membership_id).first()
    if not item: raise HTTPException(status_code=404, detail="Membership not found")
    ensure_manage(user, item.society.admin_user_id or item.society.federation.admin_user_id)
    item.status = target
    item.verified_at = datetime.now(timezone.utc) if target == MembershipStatus.ACTIVE else item.verified_at
    item.verified_by = user.id if target == MembershipStatus.ACTIVE else item.verified_by
    db.commit(); db.refresh(item)
    return membership_out(item)
