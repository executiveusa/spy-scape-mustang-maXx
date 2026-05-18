import { NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'

export async function GET() {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'MAXX BFF URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        frontend: 'online',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  let backend = {
    url: bffUrl,
    online: false,
    status: 'unreachable',
    hermes: 'unknown',
  }

  try {
    const response = await fetch(`${bffUrl}/health`, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(2000),
    })

    if (response.ok) {
      const payload = (await response.json()) as { status?: string; service?: string; hermes?: string }
      backend = {
        url: bffUrl,
        online: true,
        status: payload.status ?? 'ok',
        hermes: payload.hermes ?? 'unknown',
      }

      return NextResponse.json({
        status: 'ok',
        app: 'agent-maxx-006',
        frontend: 'online',
        backend,
        timestamp: new Date().toISOString(),
      })
    }

    backend = {
      url: bffUrl,
      online: false,
      status: `http-${response.status}`,
      hermes: 'unknown',
    }
  } catch {
    backend = {
      url: bffUrl,
      online: false,
      status: 'unreachable',
      hermes: 'unknown',
    }
  }

  return NextResponse.json(
    {
      status: 'degraded',
      app: 'agent-maxx-006',
      frontend: 'online',
      backend,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
