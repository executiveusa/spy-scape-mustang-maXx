import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'
import { operatorTenantIdFromRequest } from '@/lib/operatorAuth'

export async function GET(request: NextRequest) {
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
    const tenantId = await operatorTenantIdFromRequest(request)
    const [runtimeResponse, agUiResponse] = await Promise.all([
      fetch(`${bffUrl}/v1/runtime`, {
        cache: 'no-store',
        headers,
        signal: AbortSignal.timeout(3500),
      }),
      fetch(`${bffUrl}/v1/maxx/ag-ui/events?client_id=${encodeURIComponent(tenantId === 'all' ? 'maxx-demo' : tenantId)}&limit=40`, {
        cache: 'no-store',
        headers,
        signal: AbortSignal.timeout(3500),
      }),
    ])

    const payload = (await runtimeResponse.json()) as Record<string, unknown>
    const agUi = agUiResponse.ok ? ((await agUiResponse.json()) as Record<string, unknown>) : null
    return NextResponse.json({ ...payload, operator_tenant_id: tenantId, ag_ui: agUi }, { status: runtimeResponse.status })
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
