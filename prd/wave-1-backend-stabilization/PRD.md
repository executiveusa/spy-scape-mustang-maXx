# Wave 1: Backend Stabilization and Real Agent MAXX Execution

## Goal

Turn the existing MAXX backend from structurally correct into operationally real.

## Scope

- real Agent MAXX Lead Desk execution when provider credentials are available
- shared-secret protection for sensitive `/v1/*` backend routes while port `8010` remains public
- explicit degraded states for missing vendor, missing provider credentials, dispatch failure, and manifest mismatch
- idempotent tenant provisioning
- green `npm run build`

## Acceptance

- `/v1/maxx/runtime/health` reports provider readiness honestly
- Lead Desk task creation persists tenant files and records dispatch status
- runtime payload exposes provider state
- frontend build completes without hanging on backend fetches
- `/health` remains public and minimal, while unauthorized sensitive requests return `401`
- Vercel Next API routes send `MAXX_BFF_SHARED_SECRET` to the VPS BFF
