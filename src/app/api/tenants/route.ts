import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'

export async function GET() {
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
    const response = await fetch(`${bffUrl}/v1/clients`, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(2500),
    })

    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
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
