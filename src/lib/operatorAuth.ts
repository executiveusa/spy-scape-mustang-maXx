import type { NextRequest } from 'next/server'

export const OPERATOR_SESSION_COOKIE = 'maxx_operator_session'
export const OPERATOR_SESSION_TTL_SECONDS = 60 * 60 * 8

type OperatorSessionPayload = {
  role: 'operator'
  tenant_id: string
  exp: number
}

export type OperatorSession = {
  role: 'operator'
  tenant_id: string
  expires_at: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64EncodeBytes(bytes: Uint8Array) {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    const triple = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)
    output += base64Alphabet[(triple >> 18) & 63]
    output += base64Alphabet[(triple >> 12) & 63]
    output += index + 1 < bytes.length ? base64Alphabet[(triple >> 6) & 63] : '='
    output += index + 2 < bytes.length ? base64Alphabet[triple & 63] : '='
  }
  return output
}

function base64UrlEncode(value: string) {
  return base64EncodeBytes(encoder.encode(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  return base64EncodeBytes(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const bytes: number[] = []
  for (let index = 0; index < padded.length; index += 4) {
    const first = base64Alphabet.indexOf(padded[index])
    const second = base64Alphabet.indexOf(padded[index + 1])
    const third = padded[index + 2] === '=' ? 0 : base64Alphabet.indexOf(padded[index + 2])
    const fourth = padded[index + 3] === '=' ? 0 : base64Alphabet.indexOf(padded[index + 3])
    const triple = (first << 18) | (second << 12) | (third << 6) | fourth
    bytes.push((triple >> 16) & 255)
    if (padded[index + 2] !== '=') {
      bytes.push((triple >> 8) & 255)
    }
    if (padded[index + 3] !== '=') {
      bytes.push(triple & 255)
    }
  }
  return decoder.decode(new Uint8Array(bytes))
}

function sessionSecret() {
  return process.env.MAXX_OPERATOR_SESSION_SECRET?.trim() || process.env.MAXX_BFF_SHARED_SECRET?.trim() || ''
}

export function isOperatorAuthConfigured() {
  return Boolean(process.env.MAXX_OPERATOR_PASSWORD?.trim() && sessionSecret())
}

async function signPayload(payload: string, secret: string) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Web Crypto is required for operator session signing.')
  }

  const key = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await subtle.sign('HMAC', key, encoder.encode(payload))
  return base64UrlEncodeBytes(new Uint8Array(signature))
}

export async function createOperatorSession(tenantId = 'maxx-demo') {
  const secret = sessionSecret()
  if (!secret) {
    throw new Error('MAXX_OPERATOR_SESSION_SECRET is required for operator sessions.')
  }

  const payload: OperatorSessionPayload = {
    role: 'operator',
    tenant_id: tenantId,
    exp: Math.floor(Date.now() / 1000) + OPERATOR_SESSION_TTL_SECONDS,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await signPayload(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export async function verifyOperatorSession(token?: string | null): Promise<OperatorSession | null> {
  const secret = sessionSecret()
  if (!token || !secret || !token.includes('.')) {
    return null
  }

  const [encodedPayload, signature] = token.split('.', 2)
  const expectedSignature = await signPayload(encodedPayload, secret)
  if (signature !== expectedSignature) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as OperatorSessionPayload
    if (payload.role !== 'operator' || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return {
      role: payload.role,
      tenant_id: payload.tenant_id,
      expires_at: new Date(payload.exp * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

export async function operatorSessionFromRequest(request: NextRequest) {
  return verifyOperatorSession(request.cookies.get(OPERATOR_SESSION_COOKIE)?.value)
}

export function verifyOperatorPassword(password: string) {
  const expected = process.env.MAXX_OPERATOR_PASSWORD?.trim()
  return Boolean(expected && password === expected)
}
