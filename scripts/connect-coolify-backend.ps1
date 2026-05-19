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

  $values = New-Object System.Collections.Generic.List[object]
  $raw = Get-Content -Raw -LiteralPath $Path
  foreach ($line in ($raw -split "`r?`n")) {
    $trim = $line.Trim()
    if (-not $trim -or $trim.StartsWith('#') -or -not ($trim -match '=')) {
      continue
    }
    $parts = $trim -split '=', 2
    $values.Add([pscustomobject]@{
      Key = $parts[0].Trim()
      Value = $parts[1].Trim()
    })
  }
  return $values
}

function Get-SecretValue {
  param(
    [object[]]$Secrets,
    [string]$Key
  )

  $matches = @($Secrets | Where-Object { $_.Key -eq $Key } | Select-Object -ExpandProperty Value)
  if ($matches.Count -eq 0) {
    return $null
  }
  return $matches[-1]
}

function Get-SecretValues {
  param(
    [object[]]$Secrets,
    [string]$Pattern
  )

  $seen = @{}
  $values = New-Object System.Collections.Generic.List[string]
  foreach ($entry in $Secrets) {
    if ($entry.Key -match $Pattern -and $entry.Value -and -not $seen.ContainsKey($entry.Value)) {
      $seen[$entry.Value] = $true
      $values.Add($entry.Value)
    }
  }
  return @($values)
}

function Resolve-CoolifyConnection {
  param(
    [string]$RequestedUrl,
    [object[]]$Secrets
  )

  $urlCandidates = New-Object System.Collections.Generic.List[string]
  foreach ($candidate in @($RequestedUrl, (Get-SecretValue -Secrets $Secrets -Key 'COOLIFY_URL'), 'https://app.coolify.io')) {
    if (-not $candidate) {
      continue
    }
    if ($candidate -match 'your-coolify|example\.com|localhost') {
      continue
    }
    $normalized = $candidate.TrimEnd('/')
    if (-not $urlCandidates.Contains($normalized)) {
      $urlCandidates.Add($normalized)
    }
  }

  $tokenCandidates = New-Object System.Collections.Generic.List[string]
  foreach ($candidate in @($env:COOLIFY_API_TOKEN)) {
    if ($candidate -and -not $tokenCandidates.Contains($candidate)) {
      $tokenCandidates.Add($candidate)
    }
  }
  foreach ($candidate in (Get-SecretValues -Secrets $Secrets -Pattern '^COOLIFY.*TOKEN$')) {
    if ($candidate -and -not $tokenCandidates.Contains($candidate)) {
      $tokenCandidates.Add($candidate)
    }
  }

  if ($urlCandidates.Count -eq 0) {
    throw "COOLIFY_URL is required. Add a real URL or pass -CoolifyUrl https://app.coolify.io."
  }
  if ($tokenCandidates.Count -eq 0) {
    throw "COOLIFY_API_TOKEN is required in the secret file or process environment."
  }

  foreach ($url in $urlCandidates) {
    foreach ($token in $tokenCandidates) {
      try {
        Invoke-RestMethod -Method GET -Uri "$url/api/v1/version" -Headers @{ Authorization = "Bearer $token"; Accept = 'application/json' } -TimeoutSec 20 | Out-Null
        return [pscustomobject]@{ Url = $url; Token = $token }
      } catch {
        continue
      }
    }
  }

  throw "Could not authenticate to Coolify with the available URL/token candidates."
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

if (-not $env:MAXX_OPENROUTER_API_KEY) {
  $openRouterKey = Get-SecretValue -Secrets $secrets -Key 'MAXX_OPENROUTER_API_KEY'
  if ($openRouterKey) {
    $env:MAXX_OPENROUTER_API_KEY = $openRouterKey
  }
}
if (-not $env:MAXX_BFF_SHARED_SECRET) {
  $bffSecret = Get-SecretValue -Secrets $secrets -Key 'MAXX_BFF_SHARED_SECRET'
  if ($bffSecret) {
    $env:MAXX_BFF_SHARED_SECRET = $bffSecret
  }
}

Write-Host "Checking Coolify API..."
$connection = Resolve-CoolifyConnection -RequestedUrl $CoolifyUrl -Secrets $secrets
$script:CoolifyBase = $connection.Url
$script:CoolifyToken = $connection.Token
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
