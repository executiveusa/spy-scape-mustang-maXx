import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const ASSET_PREFIX = '/mustang-maxx-images/'

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')

  if (!name) {
    return NextResponse.json({ error: 'Missing asset name' }, { status: 400 })
  }

  const normalizedName = path.posix.basename(name.replace(/\\/g, '/'))

  if (!normalizedName) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 })
  }

  const assetUrl = new URL(`${ASSET_PREFIX}${encodeURIComponent(normalizedName)}`, request.url)

  return NextResponse.redirect(assetUrl, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
