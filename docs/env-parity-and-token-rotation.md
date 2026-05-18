# Env Parity And Token Rotation

## Vercel

Required production values:

- `MAXX_BFF_URL` or `NEXT_PUBLIC_MAXX_BFF_URL`: points to the VPS/Coolify BFF origin.
- `MAXX_BFF_SHARED_SECRET`: matches the backend value.
- `MAXX_OPERATOR_PASSWORD`: operator login password.
- `MAXX_OPERATOR_SESSION_SECRET`: signing secret for the operator cookie.
- `MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=false`.

After changing Vercel env values, redeploy production so serverless functions receive the new values.

## VPS / Coolify

Required backend values:

- `MAXX_ENV=production`
- `MAXX_ALLOWED_ORIGINS=https://spy-scape-mustang-maxx.vercel.app`
- `MAXX_BFF_SHARED_SECRET`
- `MAXX_DATA_DIR=/data/maxx`
- `MAXX_HERMES_HOME=/runtime/hermes`
- `MAXX_HERMES_VENDOR_PATH=/opt/hermes-agent`
- `MAXX_HERMES_PROVIDER=openrouter`
- `MAXX_HERMES_MODEL=openrouter/owl-alpha`
- `MAXX_OPENROUTER_API_KEY`

Persistent volumes must cover `/data/maxx` and `/runtime/hermes`.

## GitHub / Coolify Deploy

The current GitHub `Build, Push & Deploy` workflow builds the image and calls the Coolify deploy API using:

- GitHub secret `COOLIFY_WEBHOOK_URL`
- GitHub secret `COOLIFY_API_TOKEN`

Do not commit either value. Rotate the Coolify token before real client production.

## Rotation Checklist

- Rotate OpenRouter key used during setup.
- Rotate Coolify API token used during setup.
- Rotate Vercel token or revoke any temporary CLI token if one was created.
- Generate a fresh `MAXX_BFF_SHARED_SECRET`.
- Generate a fresh `MAXX_OPERATOR_PASSWORD`.
- Generate a fresh `MAXX_OPERATOR_SESSION_SECRET`.
- Redeploy Vercel and Coolify after secret rotation.
- Run `scripts/verify-production.ps1` after rotation.
