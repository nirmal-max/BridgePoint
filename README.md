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
