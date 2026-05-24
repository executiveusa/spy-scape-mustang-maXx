import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function readRequired(path) {
  const fullPath = join(root, path)
  assert.equal(existsSync(fullPath), true, `${path} must exist`)
  return readFileSync(fullPath, 'utf8')
}

const auth = readRequired('src/lib/operatorAuth.ts')
assert.match(auth, /MAXX_OPERATOR_PASSWORD/, 'operator auth must use MAXX_OPERATOR_PASSWORD')
assert.match(auth, /MAXX_OPERATOR_SESSION_SECRET/, 'operator auth must use MAXX_OPERATOR_SESSION_SECRET')
assert.match(auth, /maxx_operator_session/, 'operator auth must define the signed session cookie')
assert.match(auth, /verifyOperatorSession/, 'operator auth must expose session verification')
assert.match(auth, /operatorTenantIdFromRequest/, 'operator auth must expose tenant scope helper')
assert.match(auth, /canAccessTenant/, 'operator auth must expose tenant access checks')
assert.match(auth, /globalThis\.crypto/, 'operator session signing must use runtime-safe Web Crypto access')
assert.doesNotMatch(auth, /\b(?:btoa|atob)\b/, 'operator auth must not depend on browser-only base64 helpers')

const middleware = readRequired('src/middleware.ts')
assert.match(middleware, /PROTECTED_PAGE_PREFIXES/, 'middleware must protect operator pages')
assert.match(middleware, /PROTECTED_API_PREFIXES/, 'middleware must protect sensitive API routes')
assert.match(middleware, /\/lead-acquisition/, 'middleware must protect Lead Acquisition page')
assert.match(middleware, /\/api\/lead-acquisition/, 'middleware must protect Lead Acquisition API')
assert.match(middleware, /NextResponse\.redirect/, 'unauthenticated pages must redirect to login')
assert.match(middleware, /status:\s*401/, 'unauthenticated API requests must return 401')

const route = readRequired('src/app/api/operator-session/route.ts')
assert.match(route, /export async function POST/, 'operator session route must support login')
assert.match(route, /export async function DELETE/, 'operator session route must support logout')
assert.match(route, /export async function GET/, 'operator session route must support session checks')

const login = readRequired('src/app/login/page.tsx')
assert.match(login, /<form/, 'login page must render a real form')
assert.match(login, /\/api\/operator-session/, 'login page must call the operator session API')
assert.match(login, /Tenant scope/, 'login page must let operators choose tenant scope')

const dashboard = readRequired('src/app/dashboard/page.tsx')
assert.match(dashboard, /\/api\/runtime/, 'dashboard must load the real Agent MAXX runtime API')
assert.match(dashboard, /ag_ui/, 'dashboard must render the AG-UI operator event bridge')
assert.match(dashboard, /Lead Acquisition/, 'dashboard must link to the Lead Acquisition operator surface')
assert.doesNotMatch(dashboard, /Training Modules|Comic Reader|Nanon Banana|Mock Data/, 'dashboard must not show stale mock product surfaces')

const operatorNav = readRequired('src/components/operator/OperatorNav.tsx')
assert.match(operatorNav, /Operator Control Room/, 'operator nav must brand the backend UI as Agent MAXX')
assert.match(operatorNav, /\/api\/operator-session/, 'operator nav must provide a logout path through the session API')
for (const route of ['/dashboard', '/lead-desk', '/lead-acquisition', '/tenants', '/deploy']) {
  assert.match(operatorNav, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `operator nav must link ${route}`)
}

for (const page of [
  'src/app/dashboard/page.tsx',
  'src/app/lead-desk/page.tsx',
  'src/app/lead-acquisition/page.tsx',
  'src/app/tenants/page.tsx',
  'src/app/deploy/page.tsx',
]) {
  assert.match(readRequired(page), /OperatorNav/, `${page} must render the shared Agent MAXX operator shell`)
}

const launchChecklist = readRequired('src/components/operator/OperatorLaunchChecklist.tsx')
assert.match(launchChecklist, /New client in 15 minutes/, 'operator launch checklist must guide repeatable client onboarding')
assert.match(launchChecklist, /complete/, 'operator launch checklist must support completed steps')
assert.match(launchChecklist, /current/, 'operator launch checklist must support the next active step')
assert.match(readRequired('src/app/dashboard/page.tsx'), /OperatorLaunchChecklist/, 'dashboard must show the operator launch checklist')
assert.match(readRequired('src/app/tenants/page.tsx'), /Tenant launch checklist/, 'tenants page must show tenant launch progress')

for (const apiRoute of [
  'src/app/api/runtime/route.ts',
  'src/app/api/tenants/route.ts',
  'src/app/api/lead-desk/route.ts',
  'src/app/api/lead-acquisition/route.ts',
]) {
  const body = readRequired(apiRoute)
  assert.match(body, /operatorTenantIdFromRequest/, `${apiRoute} must read operator tenant scope`)
}

for (const apiRoute of [
  'src/app/api/tenants/route.ts',
  'src/app/api/lead-desk/route.ts',
  'src/app/api/lead-acquisition/route.ts',
]) {
  const body = readRequired(apiRoute)
  assert.match(body, /canAccessTenant/, `${apiRoute} must enforce tenant access on mutations`)
}

console.log('operator auth contract ok')
