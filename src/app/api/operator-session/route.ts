import { NextRequest, NextResponse } from 'next/server'

import {
  OPERATOR_SESSION_COOKIE,
  OPERATOR_SESSION_TTL_SECONDS,
  createOperatorSession,
  isOperatorAuthConfigured,
  operatorSessionFromRequest,
  verifyOperatorPassword,
} from '@/lib/operatorAuth'

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OPERATOR_SESSION_TTL_SECONDS,
  }
}

export async function GET(request: NextRequest) {
  const session = await operatorSessionFromRequest(request)
  return NextResponse.json({
    authenticated: Boolean(session),
    configured: isOperatorAuthConfigured(),
    session,
  })
}

export async function POST(request: NextRequest) {
  if (!isOperatorAuthConfigured()) {
    return NextResponse.json(
      {
        detail: 'Operator auth is not configured. Set MAXX_OPERATOR_PASSWORD and MAXX_OPERATOR_SESSION_SECRET.',
      },
      { status: 503 },
    )
  }

  const body = (await request.json()) as { password?: string; tenant_id?: string }
  if (!verifyOperatorPassword(body.password ?? '')) {
    return NextResponse.json({ detail: 'Invalid operator password.' }, { status: 401 })
  }

  const token = await createOperatorSession(body.tenant_id?.trim() || 'maxx-demo')
  const response = NextResponse.json({ authenticated: true, tenant_id: body.tenant_id || 'maxx-demo' })
  response.cookies.set(OPERATOR_SESSION_COOKIE, token, cookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set(OPERATOR_SESSION_COOKIE, '', {
    ...cookieOptions(),
    maxAge: 0,
  })
  return response
}
