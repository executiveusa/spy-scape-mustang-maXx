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
    const headers = maxxBffHeaders()
    const [runtimeResponse, agUiResponse] = await Promise.all([
      fetch(`${bffUrl}/v1/runtime`, {
        cache: 'no-store',
        headers,
        signal: AbortSignal.timeout(3500),
      }),
      fetch(`${bffUrl}/v1/maxx/ag-ui/events?client_id=maxx-demo&limit=40`, {
        cache: 'no-store',
        headers,
        signal: AbortSignal.timeout(3500),
      }),
    ])

    const payload = (await runtimeResponse.json()) as Record<string, unknown>
    const agUi = agUiResponse.ok ? ((await agUiResponse.json()) as Record<string, unknown>) : null
    return NextResponse.json({ ...payload, ag_ui: agUi }, { status: runtimeResponse.status })
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
