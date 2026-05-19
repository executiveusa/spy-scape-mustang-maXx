import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const forbidden = /\bHermes\b|\bhermes\b|\bHERMES\b/
const scanTargets = [
  'src/app',
  'src/components',
  'README.md',
  'backend/README.md',
  'docs/backend-deploy-runbook.md',
  'docs/env-parity-and-token-rotation.md',
  'docs/new-client-15-minute-runbook.md',
  'docs/production-readiness.md',
]

function trackedFilesUnder(target) {
  const fullPath = join(root, target)
  assert.equal(existsSync(fullPath), true, `${target} must exist`)
  if (statSync(fullPath).isFile()) {
    return [target]
  }
  const output = execFileSync('git', ['ls-files', target], { cwd: root, encoding: 'utf8' })
  return output.split(/\r?\n/).filter(Boolean)
}

const offenders = []
for (const target of scanTargets) {
  for (const file of trackedFilesUnder(target)) {
    const body = readFileSync(join(root, file), 'utf8')
    if (forbidden.test(body)) {
      offenders.push(relative(root, join(root, file)))
    }
  }
}

assert.deepEqual(offenders, [], `Visible Agent MAXX surfaces must not expose the private runtime vendor name: ${offenders.join(', ')}`)
console.log('visible Agent MAXX identity contract ok')
