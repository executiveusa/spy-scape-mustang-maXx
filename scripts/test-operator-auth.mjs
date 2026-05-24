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

const leadDeskPage = readRequired('src/app/lead-desk/page.tsx')
assert.match(leadDeskPage, /LeadDeskReviewPanel/, 'Lead Desk must render the reusable operator review panel')
assert.match(leadDeskPage, /nextPayload\.client_id/, 'Lead Desk intake must align to the active tenant returned by the backend')

const leadDeskReview = readRequired('src/components/operator/LeadDeskReviewPanel.tsx')
assert.match(leadDeskReview, /What MAXX captured/, 'Lead Desk review panel must show captured inquiry details')
assert.match(leadDeskReview, /Why MAXX scored it/, 'Lead Desk review panel must explain qualification reasons')
assert.match(leadDeskReview, /Workspace evidence/, 'Lead Desk review panel must expose workspace evidence')
assert.match(leadDeskReview, /Escalate attention/, 'Lead Desk review panel must support attention escalation')
assert.match(leadDeskReview, /Start follow-up/, 'Lead Desk review panel must support follow-up status updates')
assert.match(leadDeskReview, /Complete task/, 'Lead Desk review panel must support completion')

const leadAcquisitionPage = readRequired('src/app/lead-acquisition/page.tsx')
assert.match(leadAcquisitionPage, /LeadAcquisitionReviewPanel/, 'Lead Acquisition must render the reusable prospect review panel')
assert.match(leadAcquisitionPage, /payload\?\.client_id/, 'Lead Acquisition canary job must use the active tenant from the backend')

const acquisitionReview = readRequired('src/components/operator/LeadAcquisitionReviewPanel.tsx')
assert.match(acquisitionReview, /Why MAXX surfaced this prospect/, 'Acquisition review must explain why the prospect was surfaced')
assert.match(acquisitionReview, /Compliance gate/, 'Acquisition review must expose compliance hold state')
assert.match(acquisitionReview, /Source evidence/, 'Acquisition review must show source evidence')
assert.match(acquisitionReview, /Promoted Lead Desk task/, 'Acquisition review must link promoted prospects back to Lead Desk')
assert.match(acquisitionReview, /Promote to Lead Desk/, 'Acquisition review must support promotion')
assert.match(acquisitionReview, /Reject before outreach/, 'Acquisition review must support rejection before outreach')

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
