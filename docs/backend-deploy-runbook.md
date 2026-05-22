# Agent MAXX Backend Deploy Runbook

Agent MAXX ships as a Vercel frontend backed by a VPS/Coolify FastAPI + Agent MAXX runtime.

## Current Verified Shape

- Frontend: Vercel project `spy-scape-mustang-maxx`.
- Backend: Coolify/VPS application `agent-maxx-bff`.
- Backend port: `8010`.
- Runtime: FastAPI BFF exposes Agent MAXX and routes model work through OpenRouter.
- Persistence: SQLite under `/data/maxx`; Agent MAXX operational memory under `/runtime/maxx`.
- Deploy path: GitHub `main` runs `Build, Push & Deploy`, pushes the image, then calls the Coolify deploy API.

## Required Backend Env

Set these in Coolify/VPS, never in committed files:

```env
MAXX_ENV=production
MAXX_ALLOWED_ORIGINS=https://spy-scape-mustang-maxx.vercel.app
MAXX_BFF_SHARED_SECRET=replace-with-generated-secret
MAXX_DATA_DIR=/data/maxx
MAXX_RUNTIME_HOME=/runtime/maxx
MAXX_RUNTIME_VENDOR_PATH=/opt/agent-maxx-runtime
MAXX_RUNTIME_PROVIDER=openrouter
MAXX_RUNTIME_MODEL=openrouter/owl-alpha
MAXX_OPENROUTER_API_KEY=sk-or-v1-...
FIRECRAWL_API_KEY=replace-with-firecrawl-key
MAXX_BROWSER_WORKER_URL=http://agent-maxx-browser-worker:8020
MAXX_BROWSER_WORKER_SECRET=replace-with-worker-secret
MAXX_BROWSER_ALLOWED_DOMAINS=example.com,iana.org
MAXX_BROWSER_AUTONOMY_ENABLED=false
```

## Required Vercel Env

Set these in Vercel production, preview, and development as needed:

```env
MAXX_BFF_URL=http://31.220.58.212:8010
MAXX_BFF_SHARED_SECRET=same-secret-as-backend
MAXX_OPERATOR_PASSWORD=generated-password
MAXX_OPERATOR_SESSION_SECRET=generated-session-secret
MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false
```

After Vercel env changes, redeploy production.

## Persistent Volumes

Coolify/VPS must preserve:

- `/data/maxx` for `/data/maxx/maxx.db`
- `/runtime/maxx` for Agent MAXX workspace/runtime state
- `/opt/agent-maxx-runtime` for the private runtime driver checkout

## Private Browser Worker

Create a separate private Coolify app from `backend/browser-worker.coolify.json` or use the `agent-maxx-browser-worker` service in `docker-compose.yml`.

Required rules:

- Bind worker port `8020` privately only.
- Use the same `MAXX_BROWSER_WORKER_SECRET` in the BFF and worker.
- Keep `MAXX_BROWSER_AUTONOMY_ENABLED=false` until browser harness dependencies are installed and a tenant domain allowlist is reviewed.
- Set `MAXX_BROWSER_ALLOWED_DOMAINS` to explicit domains only; never use `*`.

Run backups before risky deploys:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-vps-state.ps1 -SshTarget "ubuntu@31.220.58.212"
```

## Deploy

The normal deploy path is:

1. Merge a green PR to `main`.
2. GitHub Actions builds and pushes the image.
3. GitHub Actions calls the Coolify deploy endpoint using GitHub secrets.
4. Vercel deploys the frontend from GitHub integration.
5. Run production verification.

Manual Coolify reconnect, if needed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/connect-coolify-backend.ps1 -UpdateEnv -Deploy
```

Browser worker Coolify reconnect, after creating the private app from `backend/browser-worker.coolify.json`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/connect-coolify-browser-worker.ps1 -UpdateEnv -Deploy
```

## Production Verification

VPS exposure gate for the current controlled demo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 `
  -BackendUrl "http://31.220.58.212:8010" `
  -BrowserWorkerUrl "http://31.220.58.212:8020" `
  -SecretFile "E:\THE PAULI FILES\.ENV" `
  -ExpectedMode controlled-demo
```

This command may pass while `8010` and `8020` are publicly reachable, but only as a controlled-demo posture. It verifies that sensitive BFF runtime routes reject unauthenticated requests and that the browser worker remains secret-protected, allowlisted, and autonomy-disabled.

Real-client network gate:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 `
  -BackendUrl "http://31.220.58.212:8010" `
  -BrowserWorkerUrl "http://31.220.58.212:8020" `
  -ExpectedMode private-required
```

This must fail while direct public ports are reachable. It should pass only after FastAPI and the browser worker are behind a firewall, private proxy, VPN, or tunnel.

Controlled demo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "http://31.220.58.212:8010" `
  -BrowserWorkerUrl "http://31.220.58.212:8020" `
  -FrontendUrl "https://spy-scape-mustang-maxx.vercel.app" `
  -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET `
  -OperatorPassword $env:MAXX_OPERATOR_PASSWORD `
  -CheckVpsNetworkExposure `
  -NetworkExpectedMode controlled-demo `
  -RequireLiveStack `
  -RequireMaxxRuntimeExecutionReady
```

Before strict live verification, validate backend env on the VPS:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-backend-production-env.ps1 -RequireSecret -RequireAcquisition
```

## Private Backend Gate

Shared-secret protection is acceptable for controlled demos only. Before real client data, choose one:

1. Bind FastAPI to a private Docker network or loopback and expose only through a trusted proxy/VPN/tunnel.
2. Firewall port `8010` to a stable allowlist.
3. Add Cloudflare Tunnel after a real Cloudflare domain is active.

Do not call the system real-client production-ready while `8010` is public.
