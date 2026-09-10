# BridgePoint

BridgePoint is a cooperative-powered work platform built with Next.js and FastAPI.

## Organization hierarchy

The organizational layer is persistent and database-backed:

```text
Federation
  -> Society
    -> CooperativeMembership
      -> existing labor User
```

Membership is an organizational relationship; it does not create a duplicate worker account.

## Authorization

- `employer`: customer job and booking capabilities.
- `labor`: worker capabilities.
- `cooperative`: federation/society/member operations owned by that cooperative account.
- `is_admin`: platform-level administrative capabilities such as payment verification.

Organization APIs enforce ownership and membership access on the backend. Workers can read their own memberships but cannot change membership status.

## Organization APIs

- `GET/POST /api/federations`
- `GET/PATCH /api/federations/{id}`
- `GET/POST /api/societies`
- `GET/PATCH /api/societies/{id}`
- `GET /api/societies/{id}/members`
- `POST /api/societies/{id}/members`
- `GET /api/memberships/me`
- `GET/PATCH /api/memberships/{id}`
- `POST /api/memberships/{id}/verify`
- `POST /api/memberships/{id}/suspend`

## Verified feature layer

The worker and customer feature layer uses persisted, authenticated records for availability, certifications, welfare, insurance, invoices, notifications, emergency requests, and wage benchmarks. These endpoints are backed by the existing SQLAlchemy database and enforce object-level authorization:

- Worker availability: GET/PATCH /api/workers/me/availability
- Certifications: GET/POST /api/workers/me/certifications
- Welfare: GET/POST /api/workers/me/welfare
- Insurance: GET/POST /api/workers/me/insurance
- Invoices: GET /api/invoices/job/{job_id}, created from existing job/payment data
- Notifications: GET /api/notifications and PATCH /api/notifications/{id}/read
- Emergency requests: POST /api/emergency, GET /api/emergency/mine, GET /api/emergency/open, POST /api/emergency/{id}/respond, PATCH /api/emergency/{id}/status
- Wage benchmark: GET /api/wage-benchmark, using recorded BridgePoint jobs only
- Provider verification: GET /api/workers/me/provider-verification, GET /api/cooperative/provider-verification, and cooperative-only verify/reject actions under /api/providers/{worker_id}

New tables use the existing SQLAlchemy create_all and safe SQLite schema initialization. No tables are dropped or reset. Welfare and insurance screens show honest empty states until real records exist; no government or external insurance integration is claimed.

## Language and PWA

English, Tamil, and Hindi are available through the shared frontend language provider. The selected language is persisted in localStorage under bp_language. The existing manifest and service worker provide responsive web/PWA behavior; no native mobile application is claimed.

## Local development

Run the backend from `backend`:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run the frontend from `frontend`:

```powershell
npm install
npm run dev
```

The project uses SQLAlchemy `create_all` for local schema creation and the existing safe SQLite column migration helper. New organization tables are created without dropping existing data. Set `JWT_SECRET_KEY` to a secure value outside local development.

## Verification

```powershell
cd frontend
npm run lint
npm run build

cd ../backend
python -m compileall -q app
```
