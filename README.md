# JoinQ

JoinQ is a monorepo for a digital queue experience.

- `frontend/` contains a Next.js landing page that explains how users join a queue by QR code and receive a notification when their turn arrives.
- `backend/` contains a Python 3.11 FastAPI service with server and database health endpoints backed by PostgreSQL.
- `.github/workflows/` contains the EC2 deployment workflow for the backend Docker image.

## Backend

The backend reads database configuration from `backend/.env` (or environment variables) and exposes:

- `GET /health`
- `GET /health/db`

## Frontend

The frontend is a Next.js application with a branded landing page for the queue product.

## Local setup

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm install
npm run dev
```
