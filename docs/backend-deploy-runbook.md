# Agent MAXX Backend Deploy Runbook

Agent MAXX ships as a Vercel frontend backed by a VPS/Coolify FastAPI + Hermes runtime.

## Current Verified Shape

- Frontend: Vercel project `spy-scape-mustang-maxx`.
- Backend: Coolify/VPS application `agent-maxx-bff`.
- Backend port: `8010`.
- Runtime: FastAPI BFF wraps Hermes Agent and OpenRouter.
- Persistence: SQLite under `/data/maxx`; Hermes operational memory under `/runtime/hermes`.
- Deploy path: GitHub `main` runs `Build, Push & Deploy`, pushes the image, then calls the Coolify deploy API.

## Required Backend Env

Set these in Coolify/VPS, never in committed files:

```env
MAXX_ENV=production
MAXX_ALLOWED_ORIGINS=https://spy-scape-mustang-maxx.vercel.app
MAXX_BFF_SHARED_SECRET=replace-with-generated-secret
MAXX_DATA_DIR=/data/maxx
MAXX_HERMES_HOME=/runtime/hermes
MAXX_HERMES_VENDOR_PATH=/opt/hermes-agent
MAXX_HERMES_PROVIDER=openrouter
MAXX_HERMES_MODEL=openrouter/owl-alpha
MAXX_OPENROUTER_API_KEY=sk-or-v1-...
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
- `/runtime/hermes` for Hermes workspace/runtime state
- `/opt/hermes-agent` for the Hermes vendor checkout

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

## Production Verification

Controlled demo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "http://31.220.58.212:8010" `
  -FrontendUrl "https://spy-scape-mustang-maxx.vercel.app" `
  -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET `
  -OperatorPassword $env:MAXX_OPERATOR_PASSWORD `
  -RequireLiveStack `
  -RequireHermesExecutionReady
```

## Private Backend Gate

Shared-secret protection is acceptable for controlled demos only. Before real client data, choose one:

1. Bind FastAPI to a private Docker network or loopback and expose only through a trusted proxy/VPN/tunnel.
2. Firewall port `8010` to a stable allowlist.
3. Add Cloudflare Tunnel after a real Cloudflare domain is active.

Do not call the system real-client production-ready while `8010` is public.
