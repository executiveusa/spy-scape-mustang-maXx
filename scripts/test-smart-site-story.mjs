import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readRequired(path) {
  const fullPath = join(root, path)
  assert.equal(existsSync(fullPath), true, `${path} must exist`)
  return readFileSync(fullPath, 'utf8')
}

const featureMap = readRequired('src/lib/publicFeatureMap.ts')
for (const label of ['Q Branch', 'MI6 Desk', 'GoldenEye', 'Aston Grid', 'Spectre Shield']) {
  assert.match(featureMap, new RegExp(label), `${label} must be a public story feature`)
}

for (const source of ['workflow_packs', 'operator_oversight', 'smart_site_manifest', 'lead_desk_tasks', 'guardrails']) {
  assert.match(featureMap, new RegExp(source), `${source} must be a literal backend-backed source`)
}

const storyRoute = readRequired('src/app/api/smart-site-story/route.ts')
for (const endpoint of ['/v1/runtime', '/v1/workflows', '/v1/clients/maxx-demo/manifest', '/v1/lead-desk/tasks', '/health']) {
  assert.match(storyRoute, new RegExp(endpoint.replace(/[/.]/g, '\\$&')), `story route must read ${endpoint}`)
}
assert.match(storyRoute, /sanitize/i, 'story route must sanitize public payloads')

const arsenal = readRequired('src/components/sections/ArsenalSection.tsx')
assert.match(arsenal, /\/api\/smart-site-story\//, 'public arsenal section must read the sanitized story endpoint')
assert.doesNotMatch(arsenal, /EJECTOR PROTOCOL|EMP CANNON|DRONE SWARM/, 'public section must not claim unsupported gadget features')

console.log('smart-site story contract ok')
