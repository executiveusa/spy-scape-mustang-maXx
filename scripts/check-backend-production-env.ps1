param(
  [switch]$RequireSecret,
  [switch]$RequireAcquisition
)

$ErrorActionPreference = 'Stop'

$required = @(
  'MAXX_ENV',
  'MAXX_ALLOWED_ORIGINS',
  'MAXX_DATA_DIR'
)

$runtimePairs = @(
  @{ preferred = 'MAXX_RUNTIME_HOME'; legacy = 'MAXX_HERMES_HOME' },
  @{ preferred = 'MAXX_RUNTIME_VENDOR_PATH'; legacy = 'MAXX_HERMES_VENDOR_PATH' },
  @{ preferred = 'MAXX_RUNTIME_PROVIDER'; legacy = 'MAXX_HERMES_PROVIDER' },
  @{ preferred = 'MAXX_RUNTIME_MODEL'; legacy = 'MAXX_HERMES_MODEL' }
)

if ($RequireSecret) {
  $required += 'MAXX_OPENROUTER_API_KEY'
  $required += 'MAXX_BFF_SHARED_SECRET'
}

if ($RequireAcquisition) {
  $required += 'FIRECRAWL_API_KEY'
  $required += 'MAXX_BROWSER_WORKER_URL'
  $required += 'MAXX_BROWSER_WORKER_SECRET'
  $required += 'MAXX_BROWSER_ALLOWED_DOMAINS'
}

$missing = @()
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    $missing += $name
  }
}

foreach ($pair in $runtimePairs) {
  if (-not [Environment]::GetEnvironmentVariable($pair.preferred) -and -not [Environment]::GetEnvironmentVariable($pair.legacy)) {
    $missing += "$($pair.preferred) or $($pair.legacy)"
  }
}

$legacyRuntimeVars = @(
  'MAXX_HERMES_HOME',
  'MAXX_HERMES_VENDOR_PATH',
  'MAXX_HERMES_PROVIDER',
  'MAXX_HERMES_MODEL'
)
foreach ($legacyName in $legacyRuntimeVars) {
  if ([Environment]::GetEnvironmentVariable($legacyName)) {
    Write-Warning "$legacyName is supported for one compatibility release; prefer MAXX_RUNTIME_* going forward."
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing required backend environment variable(s): $($missing -join ', ')"
}

$vendorPath = [Environment]::GetEnvironmentVariable('MAXX_RUNTIME_VENDOR_PATH')
if (-not $vendorPath) {
  $vendorPath = [Environment]::GetEnvironmentVariable('MAXX_HERMES_VENDOR_PATH')
}
if ($vendorPath -and -not (Test-Path $vendorPath)) {
  Write-Error "MAXX_RUNTIME_VENDOR_PATH does not exist: $vendorPath"
}

$allowedOrigins = [Environment]::GetEnvironmentVariable('MAXX_ALLOWED_ORIGINS')
if ($allowedOrigins -and $allowedOrigins.Contains('*')) {
  Write-Error "MAXX_ALLOWED_ORIGINS must not contain '*' in production."
}

if ([Environment]::GetEnvironmentVariable('MAXX_ALLOW_PUBLIC_BFF') -eq 'true') {
  Write-Error "MAXX_ALLOW_PUBLIC_BFF=true is not acceptable for real production data while auth is deferred."
}

$browserAutonomy = [Environment]::GetEnvironmentVariable('MAXX_BROWSER_AUTONOMY_ENABLED')
if ($browserAutonomy -eq 'true' -and -not [Environment]::GetEnvironmentVariable('MAXX_BROWSER_WORKER_SECRET')) {
  Write-Error "MAXX_BROWSER_AUTONOMY_ENABLED=true requires MAXX_BROWSER_WORKER_SECRET."
}

$browserAllowedDomains = [Environment]::GetEnvironmentVariable('MAXX_BROWSER_ALLOWED_DOMAINS')
if ($browserAllowedDomains -and $browserAllowedDomains.Contains('*')) {
  Write-Error "MAXX_BROWSER_ALLOWED_DOMAINS must not contain '*' in production."
}

Write-Host "Backend production environment preflight passed."
