ZTE Coolify network diagnostic plan

Objective
- Add a repeatable diagnostic for the current failure mode: Coolify app is running/healthy internally while public hostnames and direct ports are unreachable.
- Keep the script read-only and safe for production troubleshooting.

Files to create/modify
- scripts/check-coolify-network-path.ps1: query Coolify app status/log tail, test configured FQDN/backend/direct ports, and classify likely app/proxy/firewall states.
- scripts/test-launch-ops.mjs: assert the diagnostic exists and is read-only.
- docs/backend-deploy-runbook.md and docs/production-readiness.md: document when to use it.
- ops/reports/plans/ZTE-20260524-0007-coolify-network-diagnostic.md: this plan.

Validation criteria
- PowerShell parse check passes.
- Dry diagnostic runs against the current app and reports the network blocker without printing secrets.
- npm run test:launch-ops passes.
- npx tsc --noEmit and npm run build remain green.

Rollback strategy
- Revert the helper/docs/test commit. It is read-only and does not mutate infrastructure.

Risk tier
- LOW. The script is read-only and uses existing private secret bundle only for Coolify API authentication.
