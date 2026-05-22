import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'
import { canAccessTenant, operatorTenantIdFromRequest } from '@/lib/operatorAuth'

export async function GET(request: NextRequest) {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Lead Acquisition backend URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        sources: [],
        jobs: [],
        prospects: [],
      },
      { status: 503 },
    )
  }

  try {
    const tenantId = await operatorTenantIdFromRequest(request)
    const clientId = tenantId === 'all' ? 'maxx-demo' : tenantId
    const [sourcesResponse, jobsResponse, prospectsResponse, manifestResponse] = await Promise.all([
      fetch(`${bffUrl}/v1/lead-acquisition/sources`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2500),
      }),
      fetch(`${bffUrl}/v1/lead-acquisition/jobs?client_id=${clientId}`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2500),
      }),
      fetch(`${bffUrl}/v1/lead-acquisition/prospects?client_id=${clientId}`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2500),
      }),
      fetch(`${bffUrl}/v1/clients/${clientId}/manifest`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2500),
      }),
    ])

    if (!sourcesResponse.ok || !jobsResponse.ok || !prospectsResponse.ok || !manifestResponse.ok) {
      throw new Error('Lead Acquisition lookup failed')
    }

    const sourcesPayload = (await sourcesResponse.json()) as {
      sources?: Array<Record<string, unknown>>
      policy_defaults?: Record<string, unknown>
    }
    const jobsPayload = (await jobsResponse.json()) as { jobs?: Array<Record<string, unknown>> }
    const prospectsPayload = (await prospectsResponse.json()) as { prospects?: Array<Record<string, unknown>> }
    const manifestPayload = (await manifestResponse.json()) as Record<string, unknown>

    return NextResponse.json({
      status: 'ok',
      app: 'agent-maxx-006',
      operator_tenant_id: tenantId,
      client_id: clientId,
      sources: sourcesPayload.sources ?? [],
      policy_defaults: sourcesPayload.policy_defaults,
      jobs: jobsPayload.jobs ?? [],
      prospects: prospectsPayload.prospects ?? [],
      manifest: manifestPayload,
    })
  } catch {
    return NextResponse.json({
      status: 'degraded',
      app: 'agent-maxx-006',
      sources: [],
      jobs: [],
      prospects: [],
    })
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    action?: string
    prospect_id?: string
    note?: string
    preferred_channel?: string
  } & Record<string, unknown>
  const tenantId = await operatorTenantIdFromRequest(request)

  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Lead Acquisition backend URL is not production safe.'
    return NextResponse.json({ detail }, { status: 503 })
  }

  if (body.action === 'promote') {
    if (!body.prospect_id) {
      return NextResponse.json({ detail: 'prospect_id is required.' }, { status: 400 })
    }

    try {
      if (tenantId !== 'all') {
        const prospectsResponse = await fetch(`${bffUrl}/v1/lead-acquisition/prospects?client_id=${encodeURIComponent(tenantId)}`, {
          cache: 'no-store',
          headers: maxxBffHeaders(),
          signal: AbortSignal.timeout(5000),
        })
        const prospectsPayload = (await prospectsResponse.json()) as { prospects?: Array<{ prospect_id?: string }> }
        if (!prospectsPayload.prospects?.some((prospect) => prospect.prospect_id === body.prospect_id)) {
          return NextResponse.json({ detail: 'Operator session is not scoped to this tenant.' }, { status: 403 })
        }
      }

      const response = await fetch(`${bffUrl}/v1/lead-acquisition/prospects/${body.prospect_id}/promote`, {
        method: 'POST',
        headers: maxxBffHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          note: body.note,
          preferred_channel: body.preferred_channel ?? 'email',
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })
      const payload = (await response.json()) as Record<string, unknown>
      return NextResponse.json(payload, { status: response.status })
    } catch {
      return NextResponse.json({ detail: 'Lead Acquisition promotion is unavailable.' }, { status: 503 })
    }
  }

  if (body.action === 'reject') {
    if (!body.prospect_id) {
      return NextResponse.json({ detail: 'prospect_id is required.' }, { status: 400 })
    }

    try {
      if (tenantId !== 'all') {
        const prospectsResponse = await fetch(`${bffUrl}/v1/lead-acquisition/prospects?client_id=${encodeURIComponent(tenantId)}`, {
          cache: 'no-store',
          headers: maxxBffHeaders(),
          signal: AbortSignal.timeout(5000),
        })
        const prospectsPayload = (await prospectsResponse.json()) as { prospects?: Array<{ prospect_id?: string }> }
        if (!prospectsPayload.prospects?.some((prospect) => prospect.prospect_id === body.prospect_id)) {
          return NextResponse.json({ detail: 'Operator session is not scoped to this tenant.' }, { status: 403 })
        }
      }

      const response = await fetch(`${bffUrl}/v1/lead-acquisition/prospects/${body.prospect_id}`, {
        method: 'PATCH',
        headers: maxxBffHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          status: 'rejected',
          note: body.note ?? 'Operator rejected prospect before outreach.',
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      })
      const payload = (await response.json()) as Record<string, unknown>
      return NextResponse.json(payload, { status: response.status })
    } catch {
      return NextResponse.json({ detail: 'Lead Acquisition update is unavailable.' }, { status: 503 })
    }
  }

  try {
    const clientId = String(body.client_id || (tenantId === 'all' ? 'maxx-demo' : tenantId))
    if (!canAccessTenant(tenantId, clientId)) {
      return NextResponse.json({ detail: 'Operator session is not scoped to this tenant.' }, { status: 403 })
    }

    const response = await fetch(`${bffUrl}/v1/lead-acquisition/jobs`, {
      method: 'POST',
      headers: maxxBffHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...body, client_id: clientId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json({ detail: 'Lead Acquisition backend is unavailable.' }, { status: 503 })
  }
}
