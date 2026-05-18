# Agent MAXX 006

Cinematic Agent MAXX smart-site frontend with a FastAPI control plane for the Hermes-backed Lead Desk employee.

## What is live now

- Public cinematic homepage at `/`
- Operator access route at `/login`
- Command deck at `/dashboard`
- Asset pipeline at `/assets`
- Deployment console at `/deploy`
- Frontend health endpoint at `/api/health/`
- Asset redirect endpoint at `/api/assets/`
- Tenant control at `/tenants/`
- Lead Desk intake at `/lead-desk/`
- Private BFF endpoints at `127.0.0.1:8010` for local development

## Local stack

Use the verified Windows launcher from the repo root:

```bat
start-local-stack.bat
```

That flow:

- builds the Next.js app
- ensures the backend virtual environment exists
- starts the frontend on `http://127.0.0.1:3011`
- starts the BFF on `http://127.0.0.1:8010`

To stop both listeners:

```bat
stop-local-stack.bat
```

## Backend control plane

The backend now exposes a concrete operator-facing contract under [`backend/`](C:\Users\execu\Documents\vite-mustangmaxx\backend):

- `GET /health`
- `GET /v1/meta`
- `GET /v1/access`
- `GET /v1/routes`
- `GET /v1/systems`
- `GET /v1/logs`
- `GET /v1/deploy`

The backend now owns tenant manifests, Hermes profile bindings, Lead Desk task state, and runtime health. App-level auth is intentionally deferred, so the BFF must remain private in any production deployment.

## Production readiness

The v1 production target is Vercel for the Next.js smart site plus a private VPS/Coolify service for FastAPI, Hermes, profiles, and persistent data. See [`docs/production-readiness.md`](C:\Users\execu\Documents\vite-mustangmaxx\docs\production-readiness.md) for the launch gates and environment policy.

Run the local production verification bundle:

```powershell
npm run verify:production
```

Normal local and Vercel builds use standard Next output. Docker/Coolify frontend image builds set `MAXX_NEXT_STANDALONE=true` to emit `.next/standalone`.

Run strict launch verification against deployed services:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "https://private-or-tunneled-bff-origin" `
  -FrontendUrl "https://your-vercel-preview-url" `
  -RequireLiveStack `
  -RequireHermesExecutionReady
```

## Vercel linkage

This repo is already linked to:

- Project: `spy-scape-mustang-maxx`
- Project ID: `prj_i5FPLcORy8KYstJSDM2SdguJDNVr`

Current verified preview:

- `https://spy-scape-mustang-maxx-ncl58dyko-the-pauli-effect.vercel.app`

Promotion path after hardening:

```bat
vercel --prod
```

## Current blockers

- Final MAXX-owned art is still placeholder-driven
- App-level production auth is deferred; the BFF must stay private
- Hermes vendor path and OpenRouter credentials must be present before model-backed execution can be claimed
- The public asset library is down to the live placeholder set at roughly 24.6 MB
- Dependency posture is improved, but there are still moderate advisories to clear before a true production cut
