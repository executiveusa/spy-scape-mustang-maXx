param(
  [string]$CoolifyUrl = $env:COOLIFY_URL,
  [string]$AppUuid = $env:COOLIFY_BROWSER_WORKER_APP_UUID,
  [string]$SecretFile = 'C:\Users\execu\Downloads\MAXX_OPENROUTER_API_KEY=sk-or-v1-ce.txt',
  [switch]$UpdateEnv,
  [switch]$Deploy
)

$ErrorActionPreference = 'Stop'

function Read-SecretFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Secret file not found: $Path"
  }

  $values = @{}
  $raw = Get-Content -Raw -LiteralPath $Path
  foreach ($line in ($raw -split "`r?`n")) {
    $trim = $line.Trim()
    if (-not $trim -or $trim.StartsWith('#') -or -not ($trim -match '=')) {
      continue
    }
    $parts = $trim -split '=', 2
    $values[$parts[0].Trim()] = $parts[1].Trim()
  }
  return $values
}

function Invoke-Coolify {
  param(
    [ValidateSet('GET', 'POST', 'PATCH')]
    [string]$Method,
    [string]$Path,
    [object]$Body = $null
  )

  $uri = "$($script:CoolifyBase)$Path"
  $headers = @{
    Authorization = "Bearer $($script:CoolifyToken)"
    Accept = 'application/json'
  }

  if ($Body -ne $null) {
    $json = $Body | ConvertTo-Json -Depth 20
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType 'application/json' -Body $json -TimeoutSec 60
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -TimeoutSec 60
}

$secrets = Read-SecretFile -Path $SecretFile

if (-not $CoolifyUrl -and $secrets.ContainsKey('COOLIFY_URL')) {
  $CoolifyUrl = $secrets['COOLIFY_URL']
}
if (-not $script:CoolifyToken -and $secrets.ContainsKey('COOLIFY_API_TOKEN')) {
  $script:CoolifyToken = $secrets['COOLIFY_API_TOKEN']
}
if (-not $env:MAXX_BROWSER_WORKER_SECRET -and $secrets.ContainsKey('MAXX_BROWSER_WORKER_SECRET')) {
  $env:MAXX_BROWSER_WORKER_SECRET = $secrets['MAXX_BROWSER_WORKER_SECRET']
}

if (-not $CoolifyUrl) {
  throw "COOLIFY_URL is required. Add it to the secret file or pass -CoolifyUrl."
}
if (-not $script:CoolifyToken) {
  throw "COOLIFY_API_TOKEN is required in the secret file or process environment."
}

$script:CoolifyBase = $CoolifyUrl.TrimEnd('/')

Write-Host "Checking Coolify API..."
Invoke-Coolify -Method GET -Path '/api/v1/version' | Out-Null
Write-Host "Coolify reachable."

Write-Host ""
Write-Host "Discovering browser worker applications..."
$applications = Invoke-Coolify -Method GET -Path '/api/v1/applications'
$matches = @($applications | Where-Object { $_.name -match 'agent-maxx-browser-worker|browser-worker' -or $_.fqdn -match 'browser-worker|maxx-worker' })

if ($matches.Count -gt 0) {
  Write-Host "Candidate browser worker app(s):"
  foreach ($app in $matches) {
    Write-Host "- $($app.name) uuid=$($app.uuid) fqdn=$($app.fqdn) status=$($app.status)"
  }
} else {
  Write-Host "No browser worker app found. Create it from backend/browser-worker.coolify.json, then rerun with -AppUuid."
}

if (-not $AppUuid -and $matches.Count -eq 1) {
  $AppUuid = $matches[0].uuid
  Write-Host "Using discovered browser worker app UUID $AppUuid."
}

if ($UpdateEnv) {
  if (-not $AppUuid) {
    throw "-UpdateEnv requires -AppUuid, or exactly one discoverable browser worker application."
  }
  if (-not $env:MAXX_BROWSER_WORKER_SECRET) {
    throw "MAXX_BROWSER_WORKER_SECRET is required to update browser worker env."
  }

  $allowedDomains = $env:MAXX_BROWSER_ALLOWED_DOMAINS
  if (-not $allowedDomains) {
    $allowedDomains = 'example.com,iana.org'
  }
  if ($allowedDomains.Contains('*')) {
    throw "MAXX_BROWSER_ALLOWED_DOMAINS must not contain '*'."
  }

  $autonomyEnabled = $env:MAXX_BROWSER_AUTONOMY_ENABLED
  if (-not $autonomyEnabled) {
    $autonomyEnabled = 'false'
  }

  $envPayload = @{
    data = @(
      @{ key = 'MAXX_BROWSER_WORKER_SECRET'; value = $env:MAXX_BROWSER_WORKER_SECRET; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_BROWSER_ALLOWED_DOMAINS'; value = $allowedDomains; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_BROWSER_AUTONOMY_ENABLED'; value = $autonomyEnabled; is_literal = $true; is_multiline = $false; is_preview = $false }
    )
  }

  Invoke-Coolify -Method PATCH -Path "/api/v1/applications/$AppUuid/envs/bulk" -Body $envPayload | Out-Null
  Write-Host "Updated browser worker environment variables for app $AppUuid."
}

if ($Deploy) {
  if (-not $AppUuid) {
    throw "-Deploy requires -AppUuid, or exactly one discoverable browser worker application."
  }
  $deployment = Invoke-Coolify -Method GET -Path "/api/v1/deploy?uuid=$AppUuid&force=true"
  Write-Host "Deployment requested for browser worker app $AppUuid."
  $deployment | ConvertTo-Json -Depth 10
}

Write-Host ""
Write-Host "After deploy, keep the worker private and run:"
Write-Host 'powershell -ExecutionPolicy Bypass -File scripts/verify-production.ps1 -BackendUrl "http://31.220.58.212:8010" -BrowserWorkerUrl "http://31.220.58.212:8020" -FrontendUrl "https://spy-scape-mustang-maxx.vercel.app" -BffSharedSecret $env:MAXX_BFF_SHARED_SECRET -OperatorPassword $env:MAXX_OPERATOR_PASSWORD -RequireLiveStack'
