# Launch Readiness Notes

## What Is Green

- Vercel public frontend deploys from GitHub.
- VPS/Coolify backend deploy is triggered from GitHub `main`.
- Lead Desk uses SQLite as canonical app persistence.
- Operator surfaces are protected by signed session cookie.
- Public 006 story claims are mapped to backend-backed contracts.
- `/api/smart-site-story/` returns a sanitized public payload.

## Remaining Real-Client Gates

- Make backend port `8010` private by firewall, VPN, internal proxy, or tunnel.
- Rotate setup-era OpenRouter, Coolify, Vercel, BFF shared-secret, and operator auth secrets.
- Verify backups for `/data/maxx` and `/runtime/maxx`.
- Run the production verification script after every env or deployment change.

## Non-Blocking CI Annotations

- GitHub Actions still reports Node 20 action deprecation warnings.
- GitHub checkout cleanup may emit a non-blocking git exit `128` annotation.
- Track both for dependency/workflow cleanup, but they do not block the current deploy while jobs conclude successfully.
