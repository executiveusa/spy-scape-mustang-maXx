param(
  [string]$BackendUrl = $env:MAXX_VERIFY_BACKEND_URL,
  [string]$BrowserWorkerUrl = $env:MAXX_VERIFY_BROWSER_WORKER_URL,
  [ValidateSet('controlled-demo', 'private-required')]
  [string]$ExpectedMode = 'controlled-demo',
  [string]$SecretFile,
  [string]$BffSharedSecret = $env:MAXX_BFF_SHARED_SECRET
)

$ErrorActionPreference = 'Stop'

function Import-EnvFile {
  param([string]$Path)

  if (-not $Path) {
    return
  }
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Secret file was not found: $Path"
  }

  $loaded = @()
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) {
      continue
    }

    $parts = $trimmed.Split('=', 2)
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if (-not $name -or $name -match '\s') {
      continue
    }

    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    $loaded += $name
  }

  if ($loaded.Count -gt 0) {
    Write-Host "Loaded env names from ${Path}: $($loaded -join ', ')"
  } else {
    Write-Warning "No KEY=VALUE env names were loaded from $Path."
  }
}

function Invoke-JsonProbe {
  param(
    [string]$Url,
    [hashtable]$Headers = @{}
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $Headers -TimeoutSec 12
    return @{
      reachable = $true
      status_code = [int]$response.StatusCode
      body = $response.Content
      error = $null
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    return @{
      reachable = $false
      status_code = $statusCode
      body = $null
      error = $_.Exception.Message
    }
  }
}

function Convert-BodyToJson {
  param([string]$Body)
  if (-not $Body) {
    return $null
  }
  try {
    return $Body | ConvertFrom-Json
  } catch {
    return $null
  }
}

Import-EnvFile -Path $SecretFile

if (-not $BffSharedSecret) {
  $BffSharedSecret = [Environment]::GetEnvironmentVariable('MAXX_BFF_SHARED_SECRET')
}

if (-not $BackendUrl) {
  $BackendUrl = 'http://31.220.58.212:8010'
}

$BackendUrl = $BackendUrl.TrimEnd('/')
$headers = @{}
if ($BffSharedSecret) {
  $headers['X-MAXX-BFF-SECRET'] = $BffSharedSecret
}

Write-Host "Agent MAXX VPS network exposure check"
Write-Host "Expected mode: $ExpectedMode"
Write-Host "Backend URL: $BackendUrl"

$health = Invoke-JsonProbe -Url "$BackendUrl/health"
if ($health.reachable) {
  $payload = Convert-BodyToJson -Body $health.body
  Write-Host "Backend /health is publicly reachable with status $($health.status_code)."
  if ($payload -and $payload.service) {
    Write-Host "Backend service: $($payload.service); status: $($payload.status); runtime: $($payload.runtime)"
  }

  if ($ExpectedMode -eq 'private-required') {
    throw "NO-GO: backend is publicly reachable at $BackendUrl. Real-client mode requires firewall, private proxy, VPN, or tunnel first."
  }

  $sensitiveProbe = Invoke-JsonProbe -Url "$BackendUrl/v1/maxx/runtime/health"
  if ($sensitiveProbe.status_code -eq 401) {
    Write-Host "Unauthenticated /v1/maxx/runtime/health correctly returns 401."
  } elseif ($BffSharedSecret) {
    throw "NO-GO: unauthenticated /v1/maxx/runtime/health did not return 401 while a shared secret is configured."
  } else {
    Write-Warning "MAXX_BFF_SHARED_SECRET is not available locally; cannot prove unauthenticated /v1 rejection."
  }

  if ($BffSharedSecret) {
    $authorizedProbe = Invoke-JsonProbe -Url "$BackendUrl/v1/maxx/runtime/health" -Headers $headers
    if (-not $authorizedProbe.reachable -or $authorizedProbe.status_code -ne 200) {
      throw "Authorized runtime health check failed. Confirm MAXX_BFF_SHARED_SECRET matches the VPS value."
    }
    $runtime = Convert-BodyToJson -Body $authorizedProbe.body
    Write-Host "Authorized runtime health reachable; execution_ready: $($runtime.execution_ready)"
  }
} else {
  Write-Host "Backend /health is not publicly reachable."
  if ($ExpectedMode -eq 'controlled-demo') {
    Write-Warning "Controlled demo mode expected a reachable backend; this may mean the service is private or down."
  }
}

if ($BrowserWorkerUrl) {
  $BrowserWorkerUrl = $BrowserWorkerUrl.TrimEnd('/')
  Write-Host "Browser worker URL: $BrowserWorkerUrl"
  $workerProbe = Invoke-JsonProbe -Url "$BrowserWorkerUrl/health"
  if ($workerProbe.reachable) {
    $worker = Convert-BodyToJson -Body $workerProbe.body
    Write-Host "Browser worker /health is publicly reachable with status $($workerProbe.status_code)."

    if ($ExpectedMode -eq 'private-required') {
      throw "NO-GO: browser worker is publicly reachable at $BrowserWorkerUrl. Keep it private before real-client autonomous browser work."
    }

    if ($worker) {
      if (-not $worker.secret_configured) {
        throw "NO-GO: browser worker reports secret_configured=false."
      }
      if ($worker.autonomy_enabled) {
        throw "NO-GO: browser worker autonomy is enabled during controlled-demo mode."
      }
      if ($worker.allowed_domains -contains '*') {
        throw "NO-GO: browser worker allowed_domains contains '*'."
      }
      Write-Host "Browser worker safe-demo posture: autonomy=$($worker.autonomy_enabled); secret_configured=$($worker.secret_configured)."
    }
  } else {
    Write-Host "Browser worker /health is not publicly reachable."
  }
}

if ($ExpectedMode -eq 'controlled-demo') {
  Write-Host "Controlled-demo network gate passed. This is still not a real-client production approval while public ports are reachable."
} else {
  Write-Host "Private-required network gate passed."
}
