param(
  [string]$SecretFile = 'E:\THE PAULI FILES\agent-maxx-rotated-20260524.env',
  [string]$CoolifyUrl = $env:COOLIFY_URL,
  [string]$AppUuid = $env:COOLIFY_APP_UUID,
  [string]$BackendUrl = $env:MAXX_BFF_URL,
  [string]$DirectHost = '31.220.58.212',
  [int[]]$Ports = @(80, 443, 8010, 8020, 22)
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

function Get-SecretValues {
  param(
    [hashtable]$Values,
    [string]$Pattern
  )

  $foundValues = New-Object System.Collections.Generic.List[string]
  foreach ($key in $Values.Keys) {
    if ($key -match $Pattern -and $Values[$key] -and -not $foundValues.Contains($Values[$key])) {
      $foundValues.Add([string]$Values[$key])
    }
  }
  return @($foundValues)
}

function Resolve-CoolifyConnection {
  param(
    [string]$RequestedUrl,
    [hashtable]$Values
  )

  $urls = New-Object System.Collections.Generic.List[string]
  foreach ($candidate in @($RequestedUrl, $Values['COOLIFY_URL'], 'https://app.coolify.io')) {
    if (-not $candidate -or $candidate -match 'your-coolify|example\.com|localhost') {
      continue
    }
    $normalized = $candidate.TrimEnd('/')
    if (-not $urls.Contains($normalized)) {
      $urls.Add($normalized)
    }
  }

  $tokens = New-Object System.Collections.Generic.List[string]
  foreach ($candidate in @($env:COOLIFY_API_TOKEN)) {
    if ($candidate -and -not $tokens.Contains($candidate)) {
      $tokens.Add($candidate)
    }
  }
  foreach ($candidate in (Get-SecretValues -Values $Values -Pattern '^COOLIFY.*TOKEN$')) {
    if ($candidate -and -not $tokens.Contains($candidate)) {
      $tokens.Add($candidate)
    }
  }

  foreach ($url in $urls) {
    foreach ($token in $tokens) {
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
    [string]$BaseUrl,
    [string]$Token,
    [string]$Path
  )

  Invoke-RestMethod -Method GET -Uri "$BaseUrl$Path" -Headers @{ Authorization = "Bearer $Token"; Accept = 'application/json' } -TimeoutSec 30
}

function Test-HttpHealth {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 15
    return [pscustomobject]@{ Url = $Url; Reachable = $true; StatusCode = $response.StatusCode; Error = $null }
  } catch {
    return [pscustomobject]@{ Url = $Url; Reachable = $false; StatusCode = $null; Error = $_.Exception.Message }
  }
}

$values = Read-SecretFile -Path $SecretFile
$connection = Resolve-CoolifyConnection -RequestedUrl $CoolifyUrl -Values $values

$applications = Invoke-Coolify -BaseUrl $connection.Url -Token $connection.Token -Path '/api/v1/applications'
$matches = @($applications | Where-Object { $_.name -in @('agent-maxx-bff', 'agent-maxx-006') -or $_.fqdn -match 'maxx|mustang' })
if (-not $AppUuid -and $matches.Count -eq 1) {
  $AppUuid = $matches[0].uuid
}
if (-not $AppUuid) {
  throw "AppUuid is required, or exactly one Agent MAXX application must be discoverable."
}

$app = Invoke-Coolify -BaseUrl $connection.Url -Token $connection.Token -Path "/api/v1/applications/$AppUuid"
$logs = Invoke-Coolify -BaseUrl $connection.Url -Token $connection.Token -Path "/api/v1/applications/$AppUuid/logs"

$candidateUrls = New-Object System.Collections.Generic.List[string]
foreach ($url in @($BackendUrl, $values['MAXX_BFF_URL'], $app.fqdn)) {
  if ($url) {
    $healthUrl = $url.TrimEnd('/') + '/health'
    if (-not $candidateUrls.Contains($healthUrl)) {
      $candidateUrls.Add($healthUrl)
    }
  }
}

Write-Host "Coolify app: $($app.name) uuid=$($app.uuid) status=$($app.status)"
Write-Host "FQDN: $($app.fqdn)"
Write-Host "Exposed port: $($app.ports_exposes); mapped port: $($app.ports_mappings)"

$httpResults = @()
foreach ($url in $candidateUrls) {
  $result = Test-HttpHealth -Url $url
  $httpResults += $result
  if ($result.Reachable) {
    Write-Host "$($result.Url) -> $($result.StatusCode)"
  } else {
    Write-Host "$($result.Url) -> unreachable: $($result.Error)"
  }
}

$portResults = @()
foreach ($port in $Ports) {
  $reachable = Test-NetConnection -ComputerName $DirectHost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
  $portResults += [pscustomobject]@{ Host = $DirectHost; Port = $port; Reachable = $reachable }
  Write-Host "${DirectHost}:$port reachable=$reachable"
}

$logTail = (($logs.logs -split "`n") | Select-Object -Last 30) -join "`n"
$internalHealthy = $logTail -match 'GET /health HTTP/1\.1" 200 OK'
$anyPublicHttp = @($httpResults | Where-Object { $_.Reachable }).Count -gt 0
$anyPublicProxyPort = @($portResults | Where-Object { $_.Port -in @(80, 443) -and $_.Reachable }).Count -gt 0

if ($internalHealthy -and -not $anyPublicHttp -and -not $anyPublicProxyPort) {
  Write-Host "Diagnosis: app is healthy internally, but public proxy ports are closed or unreachable."
  Write-Host "Next action: restore the VPS proxy/firewall path for 80/443 or provide operator SSH/Coolify terminal access."
  exit 2
}

if ($internalHealthy -and -not $anyPublicHttp) {
  Write-Host "Diagnosis: app is healthy internally, but configured public hostnames are not routing to it."
  Write-Host "Next action: inspect Coolify proxy/domain routing for the application FQDN."
  exit 2
}

if (-not $internalHealthy) {
  Write-Host "Diagnosis: Coolify reports the app, but recent logs do not show internal /health success."
  Write-Host "Next action: inspect application logs and runtime env."
  exit 3
}

Write-Host "Diagnosis: public network path has at least one reachable health route."
