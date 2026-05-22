import { NextRequest, NextResponse } from 'next/server'

import { bffUnavailablePayload, maxxBffHeaders, maxxBffUrl } from '@/lib/maxxBffConfig'
import { operatorTenantIdFromRequest } from '@/lib/operatorAuth'

function operatorConsoleState(bffUrl: string) {
  const url = new URL(bffUrl)
  const directIpBackend = /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)
  const privateHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname) || url.hostname.endsWith('.internal')
  const tunneledOrTls = url.protocol === 'https:' && !directIpBackend
  const sharedSecretConfigured = Boolean(process.env.MAXX_BFF_SHARED_SECRET?.trim())
  const controlledDemo = directIpBackend || url.protocol !== 'https:'

  return {
    backend_origin: directIpBackend ? 'direct-vps-ip' : privateHost ? 'private-host' : 'named-origin',
    network_posture: controlledDemo ? 'controlled-demo' : 'private-ready',
    real_client_ready: Boolean(tunneledOrTls && sharedSecretConfigured),
    shared_secret_configured: sharedSecretConfigured,
    operator_message: controlledDemo
      ? 'Agent MAXX is safe for owner demos, but real client data still needs a private backend path, firewall, VPN, or tunnel.'
      : 'Agent MAXX is using a named or private backend origin; keep shared-secret and operator auth enabled.',
    next_action: controlledDemo
      ? 'Move the BFF and browser worker behind a private origin before onboarding real clients.'
      : sharedSecretConfigured
        ? 'Run the private-required VPS exposure gate before launch.'
        : 'Set MAXX_BFF_SHARED_SECRET on Vercel and the VPS before launch.',
  }
}

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
    return NextResponse.json(
      {
        ...payload,
        operator_tenant_id: tenantId,
        operator_console: operatorConsoleState(bffUrl),
        ag_ui: agUi,
      },
      { status: runtimeResponse.status },
    )
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
