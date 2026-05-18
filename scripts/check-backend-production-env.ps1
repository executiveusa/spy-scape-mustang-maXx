param(
  [switch]$RequireSecret
)

$ErrorActionPreference = 'Stop'

$required = @(
  'MAXX_ENV',
  'MAXX_ALLOWED_ORIGINS',
  'MAXX_DATA_DIR',
  'MAXX_HERMES_HOME',
  'MAXX_HERMES_VENDOR_PATH',
  'MAXX_HERMES_PROVIDER',
  'MAXX_HERMES_MODEL'
)

if ($RequireSecret) {
  $required += 'MAXX_OPENROUTER_API_KEY'
  $required += 'MAXX_BFF_SHARED_SECRET'
}

$missing = @()
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    $missing += $name
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing required backend environment variable(s): $($missing -join ', ')"
}

$vendorPath = [Environment]::GetEnvironmentVariable('MAXX_HERMES_VENDOR_PATH')
if ($vendorPath -and -not (Test-Path $vendorPath)) {
  Write-Error "MAXX_HERMES_VENDOR_PATH does not exist: $vendorPath"
}

$allowedOrigins = [Environment]::GetEnvironmentVariable('MAXX_ALLOWED_ORIGINS')
if ($allowedOrigins -and $allowedOrigins.Contains('*')) {
  Write-Error "MAXX_ALLOWED_ORIGINS must not contain '*' in production."
}

if ([Environment]::GetEnvironmentVariable('MAXX_ALLOW_PUBLIC_BFF') -eq 'true') {
  Write-Error "MAXX_ALLOW_PUBLIC_BFF=true is not acceptable for real production data while auth is deferred."
}

Write-Host "Backend production environment preflight passed."
