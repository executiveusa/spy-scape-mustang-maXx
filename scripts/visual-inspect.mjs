import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DEFAULT_ROUTES = ['/', '/login', '/dashboard', '/lead-desk', '/lead-acquisition', '/tenants', '/deploy']
const baseUrl = (process.env.MAXX_VISUAL_BASE_URL || 'http://127.0.0.1:3011').replace(/\/+$/, '')
const routes = (process.env.MAXX_VISUAL_ROUTES || DEFAULT_ROUTES.join(','))
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)
const operatorPassword = process.env.MAXX_OPERATOR_PASSWORD?.trim()
const tenantId = process.env.MAXX_OPERATOR_TENANT_ID?.trim() || 'maxx-demo'
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = process.env.MAXX_VISUAL_OUTPUT_DIR || join('ops', 'visual-inspection', timestamp)
const forbiddenText = [/Application error/i, /Unhandled Runtime Error/i, /This page could not be found/i]

function routeUrl(route) {
  return `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`
}

function screenshotName(route) {
  if (route === '/') {
    return 'home.png'
  }
  return `${route.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '').toLowerCase()}.png`
}

async function loginIfPossible(page) {
  if (!operatorPassword) {
    return { authenticated: false, reason: 'MAXX_OPERATOR_PASSWORD not set; protected routes should redirect to login.' }
  }

  const response = await page.goto(routeUrl('/login'), { waitUntil: 'domcontentloaded' })
  if (!response || response.status() >= 400) {
    throw new Error(`Login page failed with status ${response?.status() ?? 'unknown'}`)
  }

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined)
  await page.locator('input[type="password"]').fill(operatorPassword)
  const tenantInput = page.locator('input:not([type="password"])')
  if ((await tenantInput.count()) > 0) {
    await tenantInput.first().fill(tenantId)
  }
  const submitButton = page.getByRole('button', { name: /Open command deck/i })
  await submitButton.waitFor({ state: 'visible', timeout: 10000 })
  await submitButton.click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => undefined)
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)

  if (page.url().includes('/login')) {
    throw new Error('Operator login did not leave /login. Check MAXX_OPERATOR_PASSWORD and session secret.')
  }

  return { authenticated: true, tenant_id: tenantId }
}

async function inspectRoute(page, route) {
  const response = await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined)

  const status = response?.status() ?? 0
  const title = await page.title()
  const finalUrl = page.url()
  const bodyText = await page.locator('body').innerText({ timeout: 10000 })
  const screenshotPath = join(outputDir, screenshotName(route))
  await page.screenshot({ path: screenshotPath, fullPage: false })

  if (!status || status >= 500) {
    throw new Error(`${route} returned status ${status || 'unknown'}`)
  }
  if (!bodyText.trim()) {
    throw new Error(`${route} rendered an empty body`)
  }
  for (const pattern of forbiddenText) {
    if (pattern.test(bodyText) || pattern.test(title)) {
      throw new Error(`${route} rendered forbidden error text: ${pattern}`)
    }
  }

  return {
    route,
    status,
    title,
    final_url: finalUrl,
    screenshot: screenshotPath,
    redirected_to_login: finalUrl.includes('/login'),
  }
}

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()

try {
  const login = await loginIfPossible(page)
  const results = []
  for (const route of routes) {
    results.push(await inspectRoute(page, route))
  }

  const report = {
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    login,
    routes: results,
  }
  await writeFile(join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`visual inspection ok: ${outputDir}`)
  for (const result of results) {
    console.log(`${result.route} -> ${result.status} ${result.final_url} (${result.screenshot})`)
  }
} finally {
  await context.close()
  await browser.close()
}
