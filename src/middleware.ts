import { NextRequest, NextResponse } from 'next/server'

import { isOperatorAuthConfigured, operatorSessionFromRequest } from '@/lib/operatorAuth'

const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/deploy', '/tenants', '/lead-desk']
const PROTECTED_API_PREFIXES = ['/api/runtime', '/api/tenants', '/api/lead-desk']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protectsPage = matchesPrefix(pathname, PROTECTED_PAGE_PREFIXES)
  const protectsApi = matchesPrefix(pathname, PROTECTED_API_PREFIXES)

  if (!protectsPage && !protectsApi) {
    return NextResponse.next()
  }

  const session = await operatorSessionFromRequest(request)
  if (session) {
    const response = NextResponse.next()
    response.headers.set('X-MAXX-Operator-Tenant', session.tenant_id)
    response.headers.set('X-MAXX-Operator-Role', session.role)
    return response
  }

  if (protectsApi) {
    return NextResponse.json(
      {
        detail: isOperatorAuthConfigured()
          ? 'Operator session required.'
          : 'Operator auth is not configured. Set MAXX_OPERATOR_PASSWORD and MAXX_OPERATOR_SESSION_SECRET.',
      },
      { status: 401 },
    )
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
  if (!isOperatorAuthConfigured()) {
    loginUrl.searchParams.set('auth', 'unconfigured')
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*', '/deploy/:path*', '/tenants/:path*', '/lead-desk/:path*', '/api/runtime/:path*', '/api/tenants/:path*', '/api/lead-desk/:path*'],
}
