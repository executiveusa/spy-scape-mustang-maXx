# Agent MAXX Production Readiness

## Target Architecture

Agent MAXX v1 ships as a split deployment:

- Vercel serves the public Next.js smart site and operator UI.
- FastAPI, Agent MAXX runtime, tenant data, task files, and profile homes run on a private VPS or Coolify service.
- The BFF is not public while app-level auth is deferred. Access must be limited by firewall, private tunnel, VPN, or explicit IP allowlist.

## Required Production Environment

Set these on the private backend service:

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

Set this on Vercel:

```env
MAXX_BFF_URL=https://private-or-tunneled-bff-origin
MAXX_BFF_SHARED_SECRET=same-secret-as-the-private-backend
MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false
```

Use `NEXT_PUBLIC_MAXX_BFF_URL` only for local development or controlled internal deployments. Production server routes prefer `MAXX_BFF_URL` so the backend address is not required in browser code.

## Backend Deployment Package

The frontend, BFF, and browser worker have separate Coolify definitions:

- `coolify.json` is the public/frontend Dockerfile app.
- `backend/coolify.json` is the private FastAPI/Agent MAXX BFF app.
- `backend/browser-worker.coolify.json` is the private browser-worker app.

For the backend app, mount persistent volumes at:

- `/data/maxx` for SQLite tenant/task/workflow state at `/data/maxx/maxx.db`.
- `/runtime/maxx` for Agent MAXX profile homes and workspace state.
- `/opt/agent-maxx-runtime` for the private Agent MAXX runtime driver checkout.

For the browser worker app, keep the service private, set `MAXX_BROWSER_WORKER_SECRET`, and leave `MAXX_BROWSER_AUTONOMY_ENABLED=false` until the VPS has browser harness dependencies installed and tenant allowlists are reviewed.

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

## Lead Acquisition Policy

Lead Acquisition is production-safe only when it behaves like a controlled lead operations employee:

- Public web discovery runs through the private backend source driver and requires `FIRECRAWL_API_KEY`.
- Browser automation runs only in a private worker and remains disabled by default with `MAXX_BROWSER_AUTONOMY_ENABLED=false`.
- Authorized contact imports must come from owner-provided exports, approved search URLs, or explicitly approved sessions.
- Every prospect must retain source evidence, score rationale, opt-out/DNC fields, and operator review before outreach.
- Qualified prospects should be promoted into Lead Desk instead of launching direct outreach from the acquisition lane.

### Backend Exposure Choices

Use one of these before real client traffic:

| Option | Use for | Required state |
| --- | --- | --- |
| A. Loopback bind plus reverse proxy | Preferred production path | FastAPI binds to `127.0.0.1:8010`; Vercel uses a named proxy/tunnel origin; direct `8010` and `8020` are closed. Use HTTPS when a real domain or certificate is available. |
| B. Firewall allowlist | Trusted operator/Vercel-only access | VPS firewall allows `8010` only from approved IPs; all other inbound traffic is denied. |
| C. Public port plus shared secret | Controlled demo only | `MAXX_BFF_SHARED_SECRET` is active, `/v1/*` rejects unauthenticated calls, and no real client data is stored. |

Binary launch gate:

```text
GO for real clients: Option A or Option B is active, app-level auth is active, and strict verification passes.
NO-GO for real clients: backend port 8010 is public, even if the shared secret is active.
```

### Option A Caddy Bootstrap

Use this when Cloudflare is paused and no custom domain is active yet:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-vps-private-origin.ps1 `
  -SshTarget "root@31.220.58.212" `
  -OriginHost "maxx-api.31.220.58.212.sslip.io"
```

Then set Vercel:

```env
MAXX_BFF_URL=http://maxx-api.31.220.58.212.sslip.io
```

Use `-AttemptTls` if you want Certbot to request a Let's Encrypt certificate. If `sslip.io` is rate-limited, keep the HTTP named origin temporarily and move to a real domain before full client production.

After Caddy health is confirmed, apply firewall closure:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-vps-private-origin.ps1 `
  -SshTarget "root@31.220.58.212" `
  -OriginHost "maxx-api.31.220.58.212.sslip.io" `
  -ApplyFirewall
```

The installer uses durable `iptables`/`netfilter-persistent` rules for direct-port closure. The public interface is blocked for `8010` and `8020`, while loopback stays open so the named Nginx origin can still proxy to Agent MAXX.

Strict gate for Option A:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 `
  -BackendUrl "http://maxx-api.31.220.58.212.sslip.io" `
  -DirectBackendUrl "http://31.220.58.212:8010" `
  -DirectBrowserWorkerUrl "http://31.220.58.212:8020" `
  -ExpectedMode private-required `
  -AllowHttpNamedOriginForBootstrap
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

Visual verification:

```powershell
$env:MAXX_VISUAL_BASE_URL="https://spy-scape-mustang-maxx.vercel.app"
npm run verify:visual
```

This command must be run after UI, route, proxy, or deployment changes. It writes screenshot evidence and `report.json` to `ops/visual-inspection/<timestamp>/`. If `MAXX_OPERATOR_PASSWORD` is not set, protected operator routes are expected to redirect to `/login`; with the password set, the screenshots should show the authenticated dashboard, Lead Desk, acquisition lane, tenants, and deploy console.

The default Next.js build is Vercel-safe and does not emit `.next/standalone`. Container builds opt into standalone output with `MAXX_NEXT_STANDALONE=true`.

VPS network exposure verification:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 `
  -BackendUrl "http://31.220.58.212:8010" `
  -BrowserWorkerUrl "http://31.220.58.212:8020" `
  -ExpectedMode controlled-demo
```

Use `-ExpectedMode controlled-demo` only for owner-approved demos with no real client data. Use `-ExpectedMode private-required` before real-client launch; that mode must not pass until direct public access to the BFF and browser worker is removed.

Strict live backend verification:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "https://private-or-tunneled-bff-origin" `
  -BrowserWorkerUrl "https://private-or-tunneled-browser-worker-origin" `
  -FrontendUrl "https://your-vercel-preview-url" `
  -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET `
  -CheckVpsNetworkExposure `
  -NetworkExpectedMode private-required `
  -RequireLiveStack `
  -RequireMaxxRuntimeExecutionReady
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
- `/v1/maxx/runtime/health` reports `execution_ready: true`.
- `/api/runtime`, `/api/tenants`, and `/api/lead-desk` work through Next API routes.
- `/api/lead-acquisition` is protected and can create a safe canary job that promotes a reviewed prospect into Lead Desk.
- `/v1/maxx/ag-ui/events` returns runtime, task, prospect, job, and heartbeat events for the operator UI bridge.
- FastAPI is not directly reachable from an untrusted public network.
- Unauthorized `/v1/*` requests return `401` when the shared secret is configured.
- Persistent backend volumes are configured and backed up.
- Production deploys require explicit owner approval while the ZTE production gate is active.
