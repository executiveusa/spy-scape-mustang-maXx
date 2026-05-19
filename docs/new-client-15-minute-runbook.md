# New Client In 15 Minutes

Use this for a controlled Agent MAXX demo tenant on the VPS/Coolify backend and Vercel frontend.

## Inputs

- Client public name, industry, timezone, geography, summary, and primary offer.
- Routing destination for Lead Desk handoff.
- Avatar/theme notes for the later frontend art pass.
- Operator password location and BFF shared secret location. Do not paste secrets into chat or commits.

## Steps

1. Confirm Vercel production is live at `https://spy-scape-mustang-maxx.vercel.app`.
2. Confirm the VPS/Coolify backend health endpoint returns `agent-maxx-bff`.
3. Open `/tenants/` after operator login.
4. Create the tenant with the client identity and primary offer.
5. Provision the Agent MAXX profile from the tenant card.
6. Confirm the manifest shows Lead Desk in enabled workflows.
7. Open `/lead-desk/` and submit one test inquiry.
8. Confirm the task shows qualification, route, next action, Agent MAXX dispatch state, and heartbeat summary.
9. Move the task to `completed` with a verification note.
10. Run `powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1` with the live Vercel and VPS values.

## Done

- Tenant record exists in SQLite on `/data/maxx/maxx.db`.
- Agent MAXX operational workspace remains under `/runtime/maxx`.
- Vercel frontend shows the public smart-site story.
- Operator can review Lead Desk status behind login.

## Not Yet For Real Clients

Before real client data, rotate temporary tokens and make the VPS backend private by firewall, VPN, internal proxy, or tunnel.
