const DEFAULT_LOCAL_BFF_URL = 'http://127.0.0.1:8010'

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '')
}

function isLocalBffUrl(value: string) {
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

export function maxxBffUrl() {
  const configuredUrl = normalizeUrl(process.env.MAXX_BFF_URL ?? process.env.NEXT_PUBLIC_MAXX_BFF_URL ?? DEFAULT_LOCAL_BFF_URL)
  const allowLocalProduction = process.env.MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION === 'true'

  if (process.env.NODE_ENV === 'production' && isLocalBffUrl(configuredUrl) && !allowLocalProduction) {
    throw new Error(
      'MAXX_BFF_URL/NEXT_PUBLIC_MAXX_BFF_URL points to localhost in production. Set it to the private BFF URL or set MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION=true for a controlled local-only deployment.',
    )
  }

  return configuredUrl
}

export function maxxBffHeaders(extra?: Record<string, string>): Record<string, string> {
  const secret = process.env.MAXX_BFF_SHARED_SECRET?.trim()
  return {
    ...(secret ? { 'X-MAXX-BFF-SECRET': secret } : {}),
    ...(extra ?? {}),
  }
}

export function bffUnavailablePayload(detail: string) {
  return {
    status: 'degraded',
    app: 'agent-maxx-006',
    detail,
    backend_private: true,
    required_env: ['MAXX_BFF_URL'],
  }
}
