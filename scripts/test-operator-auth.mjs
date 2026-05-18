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

const middleware = readRequired('src/middleware.ts')
assert.match(middleware, /PROTECTED_PAGE_PREFIXES/, 'middleware must protect operator pages')
assert.match(middleware, /PROTECTED_API_PREFIXES/, 'middleware must protect sensitive API routes')
assert.match(middleware, /NextResponse\.redirect/, 'unauthenticated pages must redirect to login')
assert.match(middleware, /status:\s*401/, 'unauthenticated API requests must return 401')

const route = readRequired('src/app/api/operator-session/route.ts')
assert.match(route, /export async function POST/, 'operator session route must support login')
assert.match(route, /export async function DELETE/, 'operator session route must support logout')
assert.match(route, /export async function GET/, 'operator session route must support session checks')

const login = readRequired('src/app/login/page.tsx')
assert.match(login, /<form/, 'login page must render a real form')
assert.match(login, /\/api\/operator-session/, 'login page must call the operator session API')

console.log('operator auth contract ok')
