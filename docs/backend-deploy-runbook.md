# Agent MAXX Backend Deploy Runbook

This runbook finishes the private FastAPI/Hermes backend once the Coolify host is known.

## Current Verified State

- Vercel project is linked to `spy-scape-mustang-maxx`.
- `MAXX_OPENROUTER_API_KEY` is set in Vercel for production, development, and preview branch `feature/v2-clean`.
- `MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false` is set in Vercel for production, development, and preview branch `feature/v2-clean`.
- Local strict verification passes with Hermes model-backed execution.
- Missing deployment input: `COOLIFY_URL`.

## Required Secret File Shape

The local secret file can contain:

```env
MAXX_OPENROUTER_API_KEY=sk-or-v1-...
COOLIFY_API_TOKEN=...
COOLIFY_URL=https://your-coolify-host
MAXX_BFF_SHARED_SECRET=replace-with-a-generated-32-byte-secret
```

Do not commit this file.

## Create Or Select Backend App

Create a private Coolify application for the backend using:

- Dockerfile: `backend/Dockerfile`
- App definition reference: `backend/coolify.json`
- Exposed port: `8010`
- Persistent volumes:
  - `/data/maxx` for `/data/maxx/maxx.db`
  - `/runtime/hermes`
  - `/opt/hermes-agent`

The frontend `coolify.json` is not the backend app.

## Private Network Gate

Before real client traffic, choose one backend exposure pattern:

1. **Loopback or internal proxy, preferred:** bind the FastAPI service to `127.0.0.1:8010` or a private Docker network and expose it only through a trusted reverse proxy, VPN, or tunnel.
2. **Firewall allowlist:** keep `8010` reachable only from approved operator/VPN/Vercel egress IPs. This is acceptable only if the allowlist can be kept stable.
3. **Controlled demo only:** leave `8010` public with `MAXX_BFF_SHARED_SECRET` active. This is not acceptable for real client data.

Do not mark the backend production-ready for real clients until option 1 or option 2 is active and verified.

UFW allowlist template:

```bash
sudo ufw allow OpenSSH
sudo ufw deny 8010/tcp
sudo ufw allow from <trusted-ip-or-vpn-cidr> to any port 8010 proto tcp
sudo ufw enable
sudo ufw status verbose
```

## Configure And Deploy Backend

If Coolify already has an `agent-maxx-bff` app, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/connect-coolify-backend.ps1 -UpdateEnv -Deploy
```

If discovery finds more than one app, pass the app UUID:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/connect-coolify-backend.ps1 `
  -AppUuid "coolify-application-uuid" `
  -UpdateEnv `
  -Deploy
```

## Wire Vercel To Backend

After Coolify gives the private/tunneled backend origin:

```powershell
vercel env add MAXX_BFF_URL production --force --yes --value "https://private-or-tunneled-bff-origin"
vercel env add MAXX_BFF_URL preview feature/v2-clean --force --yes --value "https://private-or-tunneled-bff-origin"
vercel env add MAXX_BFF_SHARED_SECRET production --force --yes --value "same-secret-as-backend"
vercel env add MAXX_BFF_SHARED_SECRET preview feature/v2-clean --force --yes --value "same-secret-as-backend"
```

Then redeploy preview:

```powershell
vercel deploy --yes
```

## Strict Verification

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 `
  -BackendUrl "https://private-or-tunneled-bff-origin" `
  -FrontendUrl "https://spy-scape-mustang-maxx-8x7b7nca9-the-pauli-effect.vercel.app" `
  -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET `
  -RequireLiveStack `
  -RequireHermesExecutionReady
```

Only promote after this passes.

Promotion gate:

- Preview/local verification may run autonomously.
- Production deploy or DNS/backend exposure changes require explicit owner approval while the ZTE production gate is active.
- If `/v1/hermes/health` is reachable without `MAXX_BFF_SHARED_SECRET`, stop and roll back the backend env/deploy before continuing.
