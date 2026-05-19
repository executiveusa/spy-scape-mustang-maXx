import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'

export async function GET() {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Lead Desk backend URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        workflow_count: 0,
        tasks: [],
        providers: [],
      },
      { status: 503 },
    )
  }

  try {
    const [workflowResponse, taskResponse, manifestResponse, providerResponse] = await Promise.all([
      fetch(`${bffUrl}/v1/workflows`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${bffUrl}/v1/lead-desk/tasks?client_id=maxx-demo`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${bffUrl}/v1/clients/maxx-demo/manifest`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${bffUrl}/v1/maxx/runtime/providers`, {
        cache: 'no-store',
        headers: maxxBffHeaders(),
        signal: AbortSignal.timeout(2000),
      }),
    ])

    if (!workflowResponse.ok || !taskResponse.ok || !manifestResponse.ok || !providerResponse.ok) {
      throw new Error('Lead Desk lookup failed')
    }

    const workflowsPayload = (await workflowResponse.json()) as {
      workflow_packs?: Array<Record<string, unknown>>
    }
    const tasksPayload = (await taskResponse.json()) as {
      tasks?: Array<Record<string, unknown>>
    }
    const manifestPayload = (await manifestResponse.json()) as Record<string, unknown>
    const providersPayload = (await providerResponse.json()) as {
      providers?: Array<Record<string, unknown>>
    }

    return NextResponse.json({
      status: 'ok',
      app: 'agent-maxx-006',
      workflow_count: workflowsPayload.workflow_packs?.length ?? 0,
      tasks: tasksPayload.tasks ?? [],
      manifest: manifestPayload,
      providers: providersPayload.providers ?? [],
      target: `${bffUrl}/v1/lead-desk/tasks`,
    })
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        app: 'agent-maxx-006',
        workflow_count: 0,
        tasks: [],
        providers: [],
        target: 'private-bff',
      },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Lead Desk backend URL is not production safe.'
    return NextResponse.json({ detail }, { status: 503 })
  }

  try {
    const response = await fetch(`${bffUrl}/v1/lead-desk/tasks`, {
      method: 'POST',
      headers: {
        ...maxxBffHeaders({ 'Content-Type': 'application/json' }),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })

    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        detail: 'Lead Desk backend is unavailable.',
      },
      { status: 503 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { task_id?: string; status?: string; note?: string }

  if (!body.task_id || !body.status) {
    return NextResponse.json(
      {
        detail: 'task_id and status are required.',
      },
      { status: 400 }
    )
  }

  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Lead Desk backend URL is not production safe.'
    return NextResponse.json({ detail }, { status: 503 })
  }

  try {
    const response = await fetch(`${bffUrl}/v1/lead-desk/tasks/${body.task_id}`, {
      method: 'PATCH',
      headers: {
        ...maxxBffHeaders({ 'Content-Type': 'application/json' }),
      },
      body: JSON.stringify({
        status: body.status,
        note: body.note,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })

    const payload = (await response.json()) as Record<string, unknown>
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        detail: 'Lead Desk backend is unavailable.',
      },
      { status: 503 }
    )
  }
}
