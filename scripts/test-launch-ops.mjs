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

const backup = readRequired('scripts/backup-vps-state.ps1')
assert.match(backup, /\/data\/maxx/, 'backup script must include MAXX data volume')
assert.match(backup, /\/runtime\/maxx/, 'backup script must include Agent MAXX runtime volume')

const restore = readRequired('scripts/restore-vps-state.ps1')
assert.match(restore, /\/data\/maxx/, 'restore script must include MAXX data volume')
assert.match(restore, /\/runtime\/maxx/, 'restore script must include Agent MAXX runtime volume')

const backendDockerfile = readRequired('backend/Dockerfile')
assert.match(backendDockerfile, /COPY maxx_bff \.\/maxx_bff/, 'backend image must include BFF package')
assert.match(backendDockerfile, /COPY maxx_browser_worker \.\/maxx_browser_worker/, 'backend image must include browser worker package for Coolify worker app')

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

console.log('launch ops contract ok')
