import { NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'

export async function GET() {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'MAXX runtime backend URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        routes: [],
        systems: [],
        logs: [],
      },
      { status: 503 },
    )
  }

  try {
    const response = await fetch(`${bffUrl}/v1/runtime`, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(3500),
    })

    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        ...bffUnavailablePayload('MAXX runtime backend is unavailable.'),
        routes: [],
        systems: [],
        logs: [],
      },
      { status: 503 },
    )
  }
}
