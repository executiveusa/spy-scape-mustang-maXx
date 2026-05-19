import { NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'
import { featureState, publicFeatureContracts, type PublicFeatureSource } from '@/lib/publicFeatureMap'

type WorkflowPayload = {
  workflow_packs?: unknown[]
}

type TaskPayload = {
  tasks?: Array<{
    status?: string
    routing_target?: string
    next_action?: string
    heartbeat_summary?: { status?: string }
  }>
}

type ManifestPayload = {
  business?: {
    public_name?: string
    offers?: unknown[]
  }
  enabled_workflows?: string[]
}

async function readJson<T>(url: string, timeout = 2200): Promise<{ ok: boolean; payload?: T }> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(timeout),
    })
    if (!response.ok) {
      return { ok: false }
    }
    return { ok: true, payload: (await response.json()) as T }
  } catch {
    return { ok: false }
  }
}

function sanitizeEvidence(source: PublicFeatureSource, context: {
  healthOk: boolean
  runtimeOk: boolean
  workflows?: WorkflowPayload
  tasks?: TaskPayload
  manifest?: ManifestPayload
}) {
  switch (source) {
    case 'workflow_packs':
      return `${context.workflows?.workflow_packs?.length ?? 0} workflow pack(s) visible from /v1/workflows.`
    case 'operator_oversight':
      return context.runtimeOk
        ? 'Runtime status is available from /v1/runtime and operator routes are protected.'
        : 'Runtime status is degraded; operator routes remain protected.'
    case 'smart_site_manifest':
      return context.manifest?.business?.public_name
        ? `${context.manifest.business.public_name} manifest is loaded from /v1/clients/maxx-demo/manifest.`
        : 'Manifest lookup is degraded.'
    case 'lead_desk_tasks':
      return `${context.tasks?.tasks?.length ?? 0} Lead Desk task(s) visible from /v1/lead-desk/tasks.`
    case 'guardrails':
      return context.healthOk
        ? 'Public health is reachable and sensitive routes stay behind operator/session gates.'
        : 'Health is degraded; sensitive routes stay behind operator/session gates.'
  }
}

export async function GET() {
  let bffUrl: string
  try {
    bffUrl = maxxBffUrl()
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'MAXX story backend URL is not production safe.'
    return NextResponse.json(
      {
        ...bffUnavailablePayload(detail),
        features: publicFeatureContracts.map((feature) => ({
          ...feature,
          Icon: undefined,
          status: 'degraded',
          evidence: 'Private BFF URL is not configured for public story hydration.',
        })),
      },
      { status: 200 },
    )
  }

  const [health, runtime, workflows, manifest, tasks] = await Promise.all([
    readJson<{ status?: string; runtime?: string }>(`${bffUrl}/health`),
    readJson<Record<string, unknown>>(`${bffUrl}/v1/runtime`),
    readJson<WorkflowPayload>(`${bffUrl}/v1/workflows`),
    readJson<ManifestPayload>(`${bffUrl}/v1/clients/maxx-demo/manifest`),
    readJson<TaskPayload>(`${bffUrl}/v1/lead-desk/tasks?client_id=maxx-demo`),
  ])

  const context = {
    healthOk: health.ok,
    runtimeOk: runtime.ok,
    workflows: workflows.payload,
    tasks: tasks.payload,
    manifest: manifest.payload,
  }

  const liveBySource: Record<PublicFeatureSource, boolean> = {
    workflow_packs: Boolean(workflows.ok && workflows.payload?.workflow_packs?.length),
    operator_oversight: runtime.ok,
    smart_site_manifest: Boolean(manifest.ok && manifest.payload?.business),
    lead_desk_tasks: tasks.ok,
    guardrails: health.ok,
  }

  // Sanitized public payload: no operator task notes, no raw logs, no private URLs.
  const sanitizeFeatures = publicFeatureContracts.map(({ Icon: _Icon, ...feature }) => ({
    ...feature,
    status: featureState(liveBySource[feature.source]),
    evidence: sanitizeEvidence(feature.source, context),
  }))

  return NextResponse.json({
    status: Object.values(liveBySource).every(Boolean) ? 'ok' : 'degraded',
    app: 'agent-maxx-006',
    generated_at: new Date().toISOString(),
    public_contract: '006_story_map_v1',
    features: sanitizeFeatures,
  })
}
