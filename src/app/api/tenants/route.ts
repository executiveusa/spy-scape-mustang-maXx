import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'
import { canAccessTenant, operatorTenantIdFromRequest } from '@/lib/operatorAuth'

export async function GET(request: NextRequest) {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Tenant backend URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        clients: [],
      },
      { status: 503 },
    )
  }

  try {
    const tenantId = await operatorTenantIdFromRequest(request)
    const response = await fetch(`${bffUrl}/v1/clients`, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(2500),
    })

    const payload = (await response.json()) as { clients?: Array<Record<string, unknown>> } & Record<string, unknown>
    const clients = tenantId === 'all'
      ? payload.clients ?? []
      : (payload.clients ?? []).filter((client) => client.client_id === tenantId)
    return NextResponse.json({ ...payload, operator_tenant_id: tenantId, clients }, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        clients: [],
        detail: 'Tenant registry backend is unavailable.',
      },
      { status: 200 },
    )
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { action?: string; client_id?: string }
  const action = body.action ?? 'create'
  const tenantId = await operatorTenantIdFromRequest(request)
  const requestedClientId = body.client_id
  if (!canAccessTenant(tenantId, requestedClientId)) {
    return NextResponse.json({ detail: 'Operator session is not scoped to this tenant.' }, { status: 403 })
  }

  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Tenant backend URL is not production safe.'
    return NextResponse.json({ detail }, { status: 503 })
  }

  try {
    const response = await fetch(
      action === 'provision'
        ? `${bffUrl}/v1/clients/${body.client_id}/provision`
        : `${bffUrl}/v1/clients`,
      {
        method: 'POST',
        headers: {
          ...maxxBffHeaders({ 'Content-Type': 'application/json' }),
        },
        body: action === 'provision' ? undefined : JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      },
    )

    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        detail: 'Tenant registry backend is unavailable.',
      },
      { status: 503 },
    )
  }
}
