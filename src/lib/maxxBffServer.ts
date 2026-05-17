import { maxxBffHeaders, maxxBffUrl } from './maxxBffConfig'

const DEFAULT_TIMEOUT_MS = 1500

type ServerFetchOptions = {
  timeoutMs?: number
}

export async function fetchMaxxBffJson<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<{ data: T; backendOnline: boolean }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  try {
    const response = await fetch(`${maxxBffUrl()}${path}`, {
      cache: 'no-store',
      headers: maxxBffHeaders(),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) {
      throw new Error(`MAXX BFF request failed with ${response.status}`)
    }

    return {
      data: (await response.json()) as T,
      backendOnline: true,
    }
  } catch {
    throw new Error('MAXX BFF unavailable')
  }
}
