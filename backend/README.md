# Agent MAXX backend control plane

This folder is the backend landing zone for the Agent MAXX smart-site platform.

## Purpose

The public shell, deploy console, asset pipeline, and command deck now have enough surface area that the repo needs a tenant-aware control plane instead of mock references.

- `src/` stays the frontend application
- `backend/` holds the FastAPI MAXX control plane and Hermes-facing adapters

## Files

- `requirements.txt` - minimal Python runtime dependencies
- `maxx_bff/main.py` - FastAPI entry point
- `maxx_bff/control_plane.py` - tenant-aware Lead Desk orchestration
- `maxx_bff/hermes_vendor.py` - Hermes profile control adapter
- `maxx_bff/storage.py` - SQLite-backed tenant/task/workflow persistence with JSON migration
- `maxx_bff/settings.py` - environment, CORS, and production warning policy
- `tests/test_maxx_bff.py` - backend integration tests

## Live control-plane endpoints

- `GET /health`
- `GET /v1/hermes/health`
- `GET /v1/hermes/profiles`
- `GET /v1/meta`
- `GET /v1/access`
- `GET /v1/routes`
- `GET /v1/systems`
- `GET /v1/logs`
- `GET /v1/clients`
- `POST /v1/clients/{client_id}/provision`
- `GET /v1/clients/{client_id}/manifest`
- `GET /v1/workflows`
- `GET /v1/heartbeats`
- `POST /v1/lead-desk/tasks`
- `GET /v1/lead-desk/tasks`
- `GET /v1/lead-desk/tasks/{task_id}`
- `GET /v1/deploy`

## Production deployment

The backend should run on a private VPS/Coolify service, not as a public unauthenticated API.

Required environment:

```env
MAXX_ENV=production
MAXX_ALLOWED_ORIGINS=https://your-vercel-production-domain,https://your-vercel-preview-domain
MAXX_BFF_SHARED_SECRET=replace-with-a-generated-32-byte-secret
MAXX_DATA_DIR=/data/maxx
MAXX_HERMES_HOME=/runtime/hermes
MAXX_HERMES_VENDOR_PATH=/opt/hermes-agent
MAXX_HERMES_PROVIDER=openrouter
MAXX_HERMES_MODEL=openrouter/owl-alpha
MAXX_OPENROUTER_API_KEY=...
```

Use `backend/coolify.json` when creating the private backend app in Coolify. The root `coolify.json` is for the public frontend and should not be reused for the BFF.

The root `docker-compose.yml` includes `agent-maxx-bff` with persistent volumes for tenant data and Hermes runtime state. The service binds to `127.0.0.1:${BFF_PORT:-8010}:8010` by default so it is private to the host unless deliberately exposed through a tunnel, proxy, or firewall rule.

## Run locally

```powershell
cd C:\Users\execu\Documents\vite-mustangmaxx\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn maxx_bff.main:app --host 127.0.0.1 --port 8010
```

## One-command start

From the repo root:

```bat
start-local-stack.bat
```

That brings up both:

- frontend on `127.0.0.1:3011`
- BFF on `127.0.0.1:8010`

## What is still missing

- app-level production auth
- provider-backed Hermes execution credentials
- richer memory adapters beyond Hermes profile homes
- real deployment action adapters
- role-based multitenant operator access

This backend supports the v1 MAXX capability: multi-tenant Lead Desk operations backed by Hermes profile homes on one server. It can be used for a controlled production demo only when the BFF is private or shared-secret protected, persistent volumes are configured, and `/v1/hermes/health.execution_ready` is true.
