# Env Parity And Token Rotation

## Vercel

Required production values:

- `MAXX_BFF_URL` or `NEXT_PUBLIC_MAXX_BFF_URL`: points to the VPS/Coolify BFF origin.
- `MAXX_BFF_SHARED_SECRET`: matches the backend value.
- `MAXX_OPERATOR_PASSWORD`: operator login password.
- `MAXX_OPERATOR_SESSION_SECRET`: signing secret for the operator cookie.
- `MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false`.

After changing Vercel env values, redeploy production so serverless functions receive the new values.

Preferred sync command after placing a valid `VERCEL_TOKEN` in the private rotated bundle:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync-vercel-env.ps1 `
  -SecretFile "E:\THE PAULI FILES\agent-maxx-rotated-20260524.env" `
  -Apply `
  -DeployProduction
```

The script updates only Agent MAXX server-side env keys, marks secrets as sensitive, and does not print values. Run it before changing the matching Coolify `MAXX_BFF_SHARED_SECRET`, otherwise Vercel and the backend will disagree and protected proxy calls will fail.

## VPS / Coolify

Required backend values:

- `MAXX_ENV=production`
- `MAXX_ALLOWED_ORIGINS=https://spy-scape-mustang-maxx.vercel.app`
- `MAXX_BFF_SHARED_SECRET`
- `MAXX_DATA_DIR=/data/maxx`
- `MAXX_RUNTIME_HOME=/runtime/maxx`
- `MAXX_RUNTIME_VENDOR_PATH=/opt/agent-maxx-runtime`
- `MAXX_RUNTIME_PROVIDER=openrouter`
- `MAXX_RUNTIME_MODEL=openrouter/owl-alpha`
- `MAXX_OPENROUTER_API_KEY`
- `FIRECRAWL_API_KEY`
- `MAXX_BROWSER_WORKER_URL=http://agent-maxx-browser-worker:8020` or the private worker origin
- `MAXX_BROWSER_WORKER_SECRET`
- `MAXX_BROWSER_ALLOWED_DOMAINS`
- `MAXX_BROWSER_AUTONOMY_ENABLED=false` until a tenant is explicitly trusted

Persistent volumes must cover `/data/maxx` and `/runtime/maxx`.

Required private browser-worker values:

- `MAXX_BROWSER_WORKER_SECRET`: must match the BFF value.
- `MAXX_BROWSER_ALLOWED_DOMAINS`: comma-separated tenant-approved domains, never `*`.
- `MAXX_BROWSER_AUTONOMY_ENABLED=false` by default.

Browser-worker port `8020` must stay private to the VPS/Docker network.

## GitHub / Coolify Deploy

The current GitHub `Build, Push & Deploy` workflow builds the image and calls the Coolify deploy API using:

- GitHub secret `COOLIFY_WEBHOOK_URL`
- GitHub secret `COOLIFY_API_TOKEN`

Do not commit either value. Rotate the Coolify token before real client production.

## Rotation Checklist

- Rotate OpenRouter key used during setup.
- Rotate Coolify API token used during setup.
- Rotate Vercel token or revoke any temporary CLI token if one was created.
- Rotate Firecrawl key if it was used during setup.
- Rotate `MAXX_BROWSER_WORKER_SECRET`.
- Generate a fresh `MAXX_BFF_SHARED_SECRET`.
- Generate a fresh `MAXX_OPERATOR_PASSWORD`.
- Generate a fresh `MAXX_OPERATOR_SESSION_SECRET`.
- Run `scripts/sync-vercel-env.ps1 -Apply -DeployProduction` with the private rotated bundle.
- Redeploy Vercel and Coolify after secret rotation.
- Run `scripts/verify-production.ps1` after rotation.
