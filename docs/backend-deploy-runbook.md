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
```

Do not commit this file.

## Create Or Select Backend App

Create a private Coolify application for the backend using:

- Dockerfile: `backend/Dockerfile`
- App definition reference: `backend/coolify.json`
- Exposed port: `8010`
- Persistent volumes:
  - `/data/maxx`
  - `/runtime/hermes`
  - `/opt/hermes-agent`

The frontend `coolify.json` is not the backend app.

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
  -RequireLiveStack `
  -RequireHermesExecutionReady
```

Only promote after this passes.
