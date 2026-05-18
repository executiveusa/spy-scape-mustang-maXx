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
assert.match(verify, /operator-session/, 'verify-production must test operator login/session')
assert.match(verify, /smart-site-story/, 'verify-production must smoke the public story endpoint')

const backup = readRequired('scripts/backup-vps-state.ps1')
assert.match(backup, /\/data\/maxx/, 'backup script must include MAXX data volume')
assert.match(backup, /\/runtime\/hermes/, 'backup script must include Hermes runtime volume')

const restore = readRequired('scripts/restore-vps-state.ps1')
assert.match(restore, /\/data\/maxx/, 'restore script must include MAXX data volume')
assert.match(restore, /\/runtime\/hermes/, 'restore script must include Hermes runtime volume')

for (const doc of [
  'docs/backend-deploy-runbook.md',
  'docs/new-client-15-minute-runbook.md',
  'docs/env-parity-and-token-rotation.md',
]) {
  const body = readRequired(doc)
  assert.match(body, /Vercel/i, `${doc} must include Vercel guidance`)
  assert.match(body, /Coolify|VPS/i, `${doc} must include VPS/Coolify guidance`)
}

console.log('launch ops contract ok')
