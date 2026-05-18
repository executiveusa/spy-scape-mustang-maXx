# Agent MAXX Production Readiness

## Target Architecture

Agent MAXX v1 ships as a split deployment:

- Vercel serves the public Next.js smart site and operator UI.
- FastAPI, Hermes, tenant data, task files, and profile homes run on a private VPS or Coolify service.
- The BFF is not public while app-level auth is deferred. Access must be limited by firewall, private tunnel, VPN, or explicit IP allowlist.

## Required Production Environment

Set these on the private backend service:

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

Set this on Vercel:

```env
MAXX_BFF_URL=https://private-or-tunneled-bff-origin
MAXX_BFF_SHARED_SECRET=same-secret-as-the-private-backend
MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false
```

Use `NEXT_PUBLIC_MAXX_BFF_URL` only for local development or controlled internal deployments. Production server routes prefer `MAXX_BFF_URL` so the backend address is not required in browser code.

## Backend Deployment Package

The frontend and backend have separate Coolify definitions:

- `coolify.json` is the public/frontend Dockerfile app.
- `backend/coolify.json` is the private FastAPI/Hermes BFF app.

For the backend app, mount persistent volumes at:

- `/data/maxx` for SQLite tenant/task/workflow state at `/data/maxx/maxx.db`.
- `/runtime/hermes` for Hermes profile homes and workspace state.
- `/opt/hermes-agent` for the Hermes vendor checkout.

After the private backend has a reachable tunnel/private origin, set `MAXX_BFF_URL` in Vercel to that origin and redeploy the preview.

Use `docs/backend-deploy-runbook.md` as the exact handoff for creating/selecting the Coolify backend app, updating env vars, triggering deploy, wiring Vercel, and running strict verification.

Before starting the backend service, run this on the server shell after loading env vars:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-backend-production-env.ps1 -RequireSecret
```

## Private Backend Policy

Until auth is implemented, production is acceptable only if the FastAPI service is private:

- Coolify/VPS should bind FastAPI to loopback, a private network, or a tunnel origin.
- CORS must list only the Vercel production and preview origins.
- Tenant mutation endpoints must not be reachable directly from the public internet.
- `MAXX_BFF_SHARED_SECRET` must be set on both the backend and Vercel while port `8010` is reachable.
- `MAXX_ALLOW_PUBLIC_BFF=true` is not allowed for real client data.

### Backend Exposure Choices

Use one of these before real client traffic:

| Option | Use for | Required state |
| --- | --- | --- |
| A. Loopback bind plus reverse proxy | Preferred production path | FastAPI binds to `127.0.0.1:8010`; only the proxy/tunnel can reach it. |
| B. Firewall allowlist | Trusted operator/Vercel-only access | VPS firewall allows `8010` only from approved IPs; all other inbound traffic is denied. |
| C. Public port plus shared secret | Controlled demo only | `MAXX_BFF_SHARED_SECRET` is active, `/v1/*` rejects unauthenticated calls, and no real client data is stored. |

Binary launch gate:

```text
GO for real clients: Option A or Option B is active, app-level auth is active, and strict verification passes.
NO-GO for real clients: backend port 8010 is public, even if the shared secret is active.
```

### UFW Example For Option B

Run these on the VPS only after confirming SSH access works:

```bash
sudo ufw allow OpenSSH
sudo ufw deny 8010/tcp
sudo ufw allow from <trusted-ip-or-vpn-cidr> to any port 8010 proto tcp
sudo ufw enable
sudo ufw status verbose
```

If Vercel cannot provide a stable egress IP for the current plan, prefer Option A with a private tunnel/reverse proxy instead of attempting a brittle IP allowlist.

## Verification

Static and build verification:

```powershell
npm run verify:production
```

The default Next.js build is Vercel-safe and does not emit `.next/standalone`. Container builds opt into standalone output with `MAXX_NEXT_STANDALONE=true`.

Strict live backend verification:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "https://private-or-tunneled-bff-origin" `
  -FrontendUrl "https://your-vercel-preview-url" `
  -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET `
  -RequireLiveStack `
  -RequireHermesExecutionReady
```

The strict command must pass before claiming model-backed Lead Desk execution.

## jCodeMunch and Superpowers

- jCodeMunch is approved as a development code-intelligence aid only.
- Do not add jCodeMunch to production containers or runtime dependencies.
- Confirm commercial licensing before making jCodeMunch required for business delivery workflows.
- Superpowers is an internal engineering workflow layer, not a customer-facing product feature.

## Launch Gates

- `npm run verify:production` passes.
- Strict verification passes against the private backend and Vercel preview.
- `/v1/hermes/health` reports `execution_ready: true`.
- `/api/runtime`, `/api/tenants`, and `/api/lead-desk` work through Next API routes.
- FastAPI is not directly reachable from an untrusted public network.
- Unauthorized `/v1/*` requests return `401` when the shared secret is configured.
- Persistent backend volumes are configured and backed up.
- Production deploys require explicit owner approval while the ZTE production gate is active.
