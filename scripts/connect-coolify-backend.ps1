param(
  [string]$CoolifyUrl = $env:COOLIFY_URL,
  [string]$AppUuid = $env:COOLIFY_APP_UUID,
  [string]$BackendOrigin = $env:MAXX_BFF_URL,
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
if (-not $env:MAXX_OPENROUTER_API_KEY -and $secrets.ContainsKey('MAXX_OPENROUTER_API_KEY')) {
  $env:MAXX_OPENROUTER_API_KEY = $secrets['MAXX_OPENROUTER_API_KEY']
}
if (-not $env:MAXX_BFF_SHARED_SECRET -and $secrets.ContainsKey('MAXX_BFF_SHARED_SECRET')) {
  $env:MAXX_BFF_SHARED_SECRET = $secrets['MAXX_BFF_SHARED_SECRET']
}

if (-not $CoolifyUrl) {
  throw "COOLIFY_URL is required. Add COOLIFY_URL=https://your-coolify-host to the secret file or pass -CoolifyUrl."
}
if (-not $script:CoolifyToken) {
  throw "COOLIFY_API_TOKEN is required in the secret file or process environment."
}

$script:CoolifyBase = $CoolifyUrl.TrimEnd('/')

Write-Host "Checking Coolify API..."
$version = Invoke-Coolify -Method GET -Path '/api/v1/version'
Write-Host "Coolify reachable. Version response received."

Write-Host ""
Write-Host "Discovering current Coolify resources..."
$applications = Invoke-Coolify -Method GET -Path '/api/v1/applications'
$matches = @($applications | Where-Object { $_.name -in @('agent-maxx-bff', 'agent-maxx-006') -or $_.fqdn -match 'maxx|mustang' })

if ($matches.Count -gt 0) {
  Write-Host "Candidate application(s):"
  foreach ($app in $matches) {
    Write-Host "- $($app.name) uuid=$($app.uuid) fqdn=$($app.fqdn) status=$($app.status)"
  }
} else {
  Write-Host "No existing MAXX app found by name/fqdn. Create the private BFF app from backend/coolify.json, then rerun with -AppUuid."
}

if (-not $AppUuid -and $matches.Count -eq 1) {
  $AppUuid = $matches[0].uuid
  Write-Host "Using discovered app UUID $AppUuid."
}

if ($UpdateEnv) {
  if (-not $AppUuid) {
    throw "-UpdateEnv requires -AppUuid, or exactly one discoverable MAXX application."
  }
  if (-not $env:MAXX_OPENROUTER_API_KEY) {
    throw "MAXX_OPENROUTER_API_KEY is required to update backend env."
  }
  if (-not $env:MAXX_BFF_SHARED_SECRET) {
    throw "MAXX_BFF_SHARED_SECRET is required to update backend env."
  }

  $allowedOrigins = @(
    'https://spy-scape-mustang-maxx.vercel.app',
    'https://spy-scape-mustang-maxx-8x7b7nca9-the-pauli-effect.vercel.app'
  ) -join ','

  $envPayload = @{
    data = @(
      @{ key = 'MAXX_ENV'; value = 'production'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_ALLOWED_ORIGINS'; value = $allowedOrigins; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_DATA_DIR'; value = '/data/maxx'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_RUNTIME_HOME'; value = '/runtime/maxx'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_RUNTIME_VENDOR_PATH'; value = '/opt/agent-maxx-runtime'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_RUNTIME_PROVIDER'; value = 'openrouter'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_RUNTIME_MODEL'; value = 'openrouter/owl-alpha'; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_OPENROUTER_API_KEY'; value = $env:MAXX_OPENROUTER_API_KEY; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_BFF_SHARED_SECRET'; value = $env:MAXX_BFF_SHARED_SECRET; is_literal = $true; is_multiline = $false; is_preview = $false },
      @{ key = 'MAXX_ALLOW_PUBLIC_BFF'; value = 'false'; is_literal = $true; is_multiline = $false; is_preview = $false }
    )
  }

  Invoke-Coolify -Method PATCH -Path "/api/v1/applications/$AppUuid/envs/bulk" -Body $envPayload | Out-Null
  Write-Host "Updated backend environment variables for app $AppUuid."
}

if ($Deploy) {
  if (-not $AppUuid) {
    throw "-Deploy requires -AppUuid, or exactly one discoverable MAXX application."
  }
  $deployment = Invoke-Coolify -Method GET -Path "/api/v1/deploy?uuid=$AppUuid&force=true"
  Write-Host "Deployment requested for app $AppUuid."
  $deployment | ConvertTo-Json -Depth 10
}

if ($BackendOrigin) {
  Write-Host ""
  Write-Host "Backend origin supplied. Next step after Coolify health is green:"
  Write-Host "vercel env add MAXX_BFF_URL production --force --yes --value <backend-origin>"
  Write-Host "vercel env add MAXX_BFF_URL preview feature/v2-clean --force --yes --value <backend-origin>"
}
