import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readRequired(path) {
  const fullPath = join(root, path)
  assert.equal(existsSync(fullPath), true, `${path} must exist`)
  return readFileSync(fullPath, 'utf8')
}

const verify = readRequired('scripts/verify-production.ps1')
for (const command of ['test:smart-site-story', 'test:operator-auth', 'npx tsc --noEmit', 'npm run build']) {
  assert.match(verify, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `verify-production must run ${command}`)
}
assert.match(verify, /test_browser_worker\.py/, 'verify-production must run browser worker tests')
assert.match(verify, /operator-session/, 'verify-production must test operator login/session')
assert.match(verify, /smart-site-story/, 'verify-production must smoke the public story endpoint')
assert.match(verify, /RunVisualInspection/, 'verify-production must offer an explicit visual inspection gate')
assert.match(verify, /npm run verify:visual/, 'verify-production must be able to run visual inspection')
assert.match(verify, /Import-VerificationSecretFile/, 'verify-production must import a secure verification secret bundle')
assert.match(verify, /MAXX_VERIFY_BACKEND_URL/, 'verification secret import must support backend URL overrides')
assert.match(verify, /MAXX_OPERATOR_PASSWORD/, 'verification secret import must support operator login smoke checks')
assert.match(verify, /check-vps-network-exposure\.ps1/, 'verify-production must be able to run the VPS network exposure gate')
assert.match(readRequired('backend/README.md'), /\/v1\/maxx\/ag-ui\/events/, 'backend README must document the AG-UI event bridge')
assert.match(readRequired('docs/production-readiness.md'), /\/v1\/maxx\/ag-ui\/events/, 'production readiness must include AG-UI bridge verification')

const deployPage = readRequired('src/app/deploy/page.tsx')
assert.match(deployPage, /Production closeout gates/, 'deploy console must show production closeout gates')
assert.match(deployPage, /Private backend origin/, 'deploy console must show the private backend gate')
assert.match(deployPage, /Token rotation/, 'deploy console must show the token rotation gate')
assert.match(deployPage, /Visual inspection/, 'deploy console must show the visual inspection gate')

const exposure = readRequired('scripts/check-vps-network-exposure.ps1')
assert.match(exposure, /private-required/, 'network exposure checker must support a private-required real-client gate')
assert.match(exposure, /controlled-demo/, 'network exposure checker must support a controlled-demo gate')
assert.match(exposure, /\/v1\/maxx\/runtime\/health/, 'network exposure checker must verify sensitive runtime health protection')
assert.match(exposure, /MAXX_BFF_SHARED_SECRET/, 'network exposure checker must support the BFF shared secret')
assert.match(exposure, /DirectBackendUrl/, 'network exposure checker must prove direct BFF port closure for private origin mode')
assert.match(exposure, /DirectBrowserWorkerUrl/, 'network exposure checker must prove direct browser-worker port closure')
assert.match(exposure, /AllowHttpNamedOriginForBootstrap/, 'network exposure checker must make temporary HTTP bootstrap explicit')

const backup = readRequired('scripts/backup-vps-state.ps1')
assert.match(backup, /\/data\/maxx/, 'backup script must include MAXX data volume')
assert.match(backup, /\/runtime\/maxx/, 'backup script must include Agent MAXX runtime volume')

const restore = readRequired('scripts/restore-vps-state.ps1')
assert.match(restore, /\/data\/maxx/, 'restore script must include MAXX data volume')
assert.match(restore, /\/runtime\/maxx/, 'restore script must include Agent MAXX runtime volume')

const backendDockerfile = readRequired('backend/Dockerfile')
assert.match(backendDockerfile, /COPY maxx_bff \.\/maxx_bff/, 'backend image must include BFF package')
assert.match(backendDockerfile, /COPY maxx_browser_worker \.\/maxx_browser_worker/, 'backend image must include browser worker package for Coolify worker app')

const workerDockerfile = readRequired('backend/Dockerfile.browser-worker')
assert.match(workerDockerfile, /EXPOSE 8020/, 'browser worker image must expose worker port')
assert.match(workerDockerfile, /maxx_browser_worker\.main:app/, 'browser worker image must start the worker app')

const workerManifest = readRequired('backend/browser-worker.coolify.json')
assert.match(workerManifest, /Dockerfile\.browser-worker/, 'browser worker Coolify manifest must use the dedicated worker Dockerfile')

assert.match(readRequired('ops/private-origin/nginx-agent-maxx-private-origin.conf'), /proxy_pass http:\/\/127\.0\.0\.1:8010/, 'private-origin Nginx template must proxy only to loopback BFF')
assert.match(readRequired('scripts/install-vps-private-origin.ps1'), /sslip\.io/, 'private-origin installer must provide a no-DNS bootstrap hostname')
assert.match(readRequired('scripts/install-vps-private-origin.ps1'), /DOCKER-USER/, 'private-origin installer must close Docker-published direct ports when requested')
assert.match(readRequired('package.json'), /verify:visual/, 'package scripts must include a visual inspection command')
assert.match(readRequired('scripts/visual-inspect.mjs'), /ops['"], ['"]visual-inspection/, 'visual inspection must write screenshot evidence under ops/visual-inspection')

const browserWorkerConnect = readRequired('scripts/connect-coolify-browser-worker.ps1')
assert.match(browserWorkerConnect, /MAXX_BROWSER_WORKER_SECRET/, 'browser worker connector must update worker secret')
assert.match(browserWorkerConnect, /MAXX_BROWSER_ALLOWED_DOMAINS/, 'browser worker connector must update allowed domains')
assert.match(browserWorkerConnect, /MAXX_BROWSER_AUTONOMY_ENABLED/, 'browser worker connector must control autonomy flag')
assert.match(browserWorkerConnect, /deploy\?uuid=/, 'browser worker connector must support Coolify deploy')
assert.match(browserWorkerConnect, /Resolve-CoolifyConnection/, 'browser worker connector must autodiscover a working Coolify URL/token pair')
assert.match(browserWorkerConnect, /https:\/\/app\.coolify\.io/, 'browser worker connector must fall back to Coolify Cloud when local env has placeholders')
assert.match(browserWorkerConnect, /Get-SecretValues/, 'browser worker connector must handle duplicate Coolify token keys safely')

const backendConnect = readRequired('scripts/connect-coolify-backend.ps1')
assert.match(backendConnect, /Resolve-CoolifyConnection/, 'backend connector must autodiscover a working Coolify URL/token pair')
assert.match(backendConnect, /https:\/\/app\.coolify\.io/, 'backend connector must fall back to Coolify Cloud when local env has placeholders')
assert.match(backendConnect, /Get-SecretValues/, 'backend connector must handle duplicate Coolify token keys safely')
assert.match(backendConnect, /FIRECRAWL_API_KEY/, 'backend connector must update Firecrawl source credentials')
assert.match(backendConnect, /MAXX_BROWSER_WORKER_SECRET/, 'backend connector must wire the private browser worker secret')
assert.match(backendConnect, /MAXX_BROWSER_AUTONOMY_ENABLED/, 'backend connector must keep browser autonomy explicitly controlled')

const vercelSync = readRequired('scripts/sync-vercel-env.ps1')
assert.match(vercelSync, /Dry run only/, 'Vercel env sync must default to dry run')
assert.match(vercelSync, /upsert=true/, 'Vercel env sync must upsert values instead of duplicating them')
assert.match(vercelSync, /MAXX_BFF_SHARED_SECRET/, 'Vercel env sync must update the BFF shared secret')
assert.match(vercelSync, /MAXX_OPERATOR_SESSION_SECRET/, 'Vercel env sync must update the operator session secret')
assert.match(vercelSync, /Type = 'sensitive'/, 'Vercel env sync must mark secrets as sensitive')
assert.match(vercelSync, /DeployProduction/, 'Vercel env sync must optionally redeploy production')
assert.doesNotMatch(vercelSync, /Write-Host[^\n]*\$value/i, 'Vercel env sync must not print env values')

const coolifyNetwork = readRequired('scripts/check-coolify-network-path.ps1')
assert.match(coolifyNetwork, /running|healthy|status/i, 'Coolify network diagnostic must report app status')
assert.match(coolifyNetwork, /GET \/health HTTP\/1\\\.1" 200 OK/, 'Coolify network diagnostic must detect internal health evidence')
assert.match(coolifyNetwork, /public proxy ports are closed/, 'Coolify network diagnostic must classify proxy/firewall blockers')
assert.match(coolifyNetwork, /Test-NetConnection/, 'Coolify network diagnostic must test direct network ports')
assert.doesNotMatch(coolifyNetwork, /Invoke-RestMethod -Method (POST|PATCH|DELETE)/, 'Coolify network diagnostic must stay read-only')

for (const doc of [
  'docs/backend-deploy-runbook.md',
  'docs/new-client-15-minute-runbook.md',
  'docs/env-parity-and-token-rotation.md',
]) {
  const body = readRequired(doc)
  assert.match(body, /Vercel/i, `${doc} must include Vercel guidance`)
  assert.match(body, /Coolify|VPS/i, `${doc} must include VPS/Coolify guidance`)
  assert.match(body, /browser worker|browser-worker|MAXX_BROWSER/i, `${doc} must include private browser worker guidance`)
}

assert.match(readRequired('docs/backend-deploy-runbook.md'), /check-vps-network-exposure\.ps1/, 'backend deploy runbook must document the VPS exposure gate')
assert.match(readRequired('docs/production-readiness.md'), /check-vps-network-exposure\.ps1/, 'production readiness must document the VPS exposure gate')
assert.match(readRequired('docs/backend-deploy-runbook.md'), /npm run verify:visual/, 'backend deploy runbook must include visual inspection')
assert.match(readRequired('docs/production-readiness.md'), /npm run verify:visual/, 'production readiness must include visual inspection')

console.log('launch ops contract ok')
