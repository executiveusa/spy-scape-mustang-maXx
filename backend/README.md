# Agent MAXX backend control plane

This folder is the backend landing zone for the Agent MAXX smart-site platform.

## Purpose

The public shell, deploy console, asset pipeline, and command deck now have enough surface area that the repo needs a tenant-aware control plane instead of mock references.

- `src/` stays the frontend application
- `backend/` holds the FastAPI MAXX control plane and private runtime adapters

## Files

- `requirements.txt` - minimal Python runtime dependencies
- `maxx_bff/main.py` - FastAPI entry point
- `maxx_bff/control_plane.py` - tenant-aware Lead Desk and Lead Acquisition orchestration
- `maxx_bff/lead_acquisition_drivers.py` - private source health for web research, browser worker, and authorized contact import
- `maxx_bff/maxx_runtime.py` - Agent MAXX runtime service boundary
- private vendor driver adapter kept behind the MAXX boundary
- `maxx_bff/storage.py` - SQLite-backed tenant/task/workflow persistence with JSON migration
- `maxx_bff/settings.py` - environment, CORS, and production warning policy
- `tests/test_maxx_bff.py` - backend integration tests

## Live control-plane endpoints

- `GET /health`
- `GET /v1/maxx/runtime/health`
- `GET /v1/maxx/runtime/profiles`
- `GET /v1/maxx/runtime/providers`
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
- `GET /v1/maxx/browser/health`
- `GET /v1/maxx/web-research/health`
- `POST /v1/lead-desk/tasks`
- `GET /v1/lead-desk/tasks`
- `GET /v1/lead-desk/tasks/{task_id}`
- `GET /v1/lead-acquisition/sources`
- `POST /v1/lead-acquisition/jobs`
- `GET /v1/lead-acquisition/jobs`
- `GET /v1/lead-acquisition/jobs/{job_id}`
- `GET /v1/lead-acquisition/prospects`
- `POST /v1/lead-acquisition/prospects/{prospect_id}/promote`
- `GET /v1/deploy`

## Production deployment

The backend should run on a private VPS/Coolify service, not as a public unauthenticated API.

Required environment:

```env
MAXX_ENV=production
MAXX_ALLOWED_ORIGINS=https://your-vercel-production-domain,https://your-vercel-preview-domain
MAXX_BFF_SHARED_SECRET=replace-with-a-generated-32-byte-secret
MAXX_DATA_DIR=/data/maxx
MAXX_RUNTIME_HOME=/runtime/maxx
MAXX_RUNTIME_VENDOR_PATH=/opt/agent-maxx-runtime
MAXX_RUNTIME_PROVIDER=openrouter
MAXX_RUNTIME_MODEL=openrouter/owl-alpha
MAXX_OPENROUTER_API_KEY=...
FIRECRAWL_API_KEY=...
MAXX_BROWSER_WORKER_URL=
MAXX_BROWSER_AUTONOMY_ENABLED=false
```

Use `backend/coolify.json` when creating the private backend app in Coolify. The root `coolify.json` is for the public frontend and should not be reused for the BFF.

The root `docker-compose.yml` includes `agent-maxx-bff` with persistent volumes for tenant data and Agent MAXX runtime state. The service binds to `127.0.0.1:${BFF_PORT:-8010}:8010` by default so it is private to the host unless deliberately exposed through a tunnel, proxy, or firewall rule.

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
- provider-backed Agent MAXX execution credentials
- richer memory adapters beyond Agent MAXX profile homes
- real deployment action adapters
- role-based multitenant operator access
- production browser-worker isolation and tenant-specific acquisition allowlists
- final outreach approval, suppression-list, and compliance runbooks

This backend supports the v1 MAXX capability: multi-tenant Lead Desk operations backed by Agent MAXX profile homes on one server. Lead Acquisition is a canary workflow that discovers or imports owner-approved prospects, scores and dedupes them, retains evidence, and promotes reviewed prospects into Lead Desk tasks. It can be used for a controlled production demo only when the BFF is private or shared-secret protected, persistent volumes are configured, and `/v1/maxx/runtime/health.execution_ready` is true.
