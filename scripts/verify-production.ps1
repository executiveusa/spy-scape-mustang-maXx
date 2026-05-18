param(
  [string]$BackendUrl = $env:MAXX_VERIFY_BACKEND_URL,
  [string]$FrontendUrl = $env:MAXX_VERIFY_FRONTEND_URL,
  [string]$BffSharedSecret = $env:MAXX_BFF_SHARED_SECRET,
  [switch]$RequireLiveStack,
  [switch]$RequireHermesExecutionReady
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "== $Name =="
  & $Command
}

function Invoke-JsonGet {
  param([string]$Url)
  $headers = @{}
  if ($script:BffSharedSecret) {
    $headers['X-MAXX-BFF-SECRET'] = $script:BffSharedSecret
  }
  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $headers -TimeoutSec 15
  return $response.Content | ConvertFrom-Json
}

function Invoke-JsonPost {
  param(
    [string]$Url,
    [object]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 10
  $headers = @{}
  if ($script:BffSharedSecret) {
    $headers['X-MAXX-BFF-SECRET'] = $script:BffSharedSecret
  }
  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $headers -TimeoutSec 30 -Method Post -ContentType 'application/json' -Body $json
  return $response.Content | ConvertFrom-Json
}

function Invoke-AuthorizedPatch {
  param(
    [string]$Url,
    [object]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 10
  $headers = @{}
  if ($script:BffSharedSecret) {
    $headers['X-MAXX-BFF-SECRET'] = $script:BffSharedSecret
  }
  return Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $headers -TimeoutSec 30 -Method Patch -ContentType 'application/json' -Body $json
}

Push-Location $root
try {
  Invoke-Step "Backend integration tests" {
    py -3 -m unittest backend\tests\test_maxx_bff.py -v
    if ($LASTEXITCODE -ne 0) {
      throw "Backend integration tests failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Next.js production build" {
    npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Next.js production build failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "TypeScript no-emit check" {
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
      throw "TypeScript no-emit check failed with exit code $LASTEXITCODE."
    }
  }

  if (-not $BackendUrl) {
    $BackendUrl = 'http://127.0.0.1:8010'
  }
  $BackendUrl = $BackendUrl.TrimEnd('/')

  $backendReachable = $false
  try {
    Invoke-Step "BFF health smoke check" {
      $health = Invoke-JsonGet "$BackendUrl/health"
      if (-not $health.service -or $health.service -ne 'agent-maxx-bff') {
        throw "Unexpected BFF health payload from $BackendUrl/health"
      }
      Write-Host "BFF status: $($health.status); Hermes: $($health.hermes)"
      $script:backendReachable = $true
    }
  } catch {
    if ($RequireLiveStack) {
      throw
    }
    Write-Warning "Skipping live BFF checks because $BackendUrl is unreachable: $($_.Exception.Message)"
  }

  if ($backendReachable) {
    if ($BffSharedSecret) {
      Invoke-Step "BFF shared-secret gate" {
        try {
          Invoke-WebRequest -UseBasicParsing -Uri "$BackendUrl/v1/hermes/health" -TimeoutSec 15 | Out-Null
          throw "Unauthenticated /v1/hermes/health unexpectedly succeeded."
        } catch {
          if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) {
            Write-Host "Unauthenticated /v1 requests are rejected."
          } else {
            throw
          }
        }
      }
    } else {
      Write-Warning "MAXX_BFF_SHARED_SECRET is not set for verification; skipping unauthorized /v1 gate check."
    }

    Invoke-Step "Hermes runtime readiness" {
      $hermes = Invoke-JsonGet "$BackendUrl/v1/hermes/health"
      Write-Host "Hermes status: $($hermes.status); execution_ready: $($hermes.execution_ready)"
      if ($RequireHermesExecutionReady -and -not $hermes.execution_ready) {
        throw "Hermes execution_ready is false. Resolve vendor path and provider credentials before launch."
      }
    }

    Invoke-Step "Agent MAXX wrapper readiness" {
      $readiness = Invoke-JsonGet "$BackendUrl/v1/maxx/readiness"
      if ($readiness.runtime_wrapper.base_runtime -ne 'Hermes Agent') {
        throw "MAXX readiness endpoint did not report Hermes Agent as the base runtime."
      }
      if (-not $readiness.can_run_today) {
        throw "Agent MAXX is not ready to run today: $($readiness.blockers -join '; ')"
      }
      Write-Host "MAXX run mode: $($readiness.run_mode); model-backed: $($readiness.model_backed_execution_ready)"
    }

    Invoke-Step "Tenant provision and Lead Desk round trip" {
      $clientId = "verify-$((Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))"
      $tenant = Invoke-JsonPost "$BackendUrl/v1/clients" @{
        client_id = $clientId
        public_name = "MAXX Verification Tenant"
        industry = "Verification"
        timezone = "America/Mexico_City"
        geography = @("Remote")
        summary = "Temporary tenant created by production verification."
        primary_offer = "Lead Desk Verification"
      }
      if ($tenant.client_id -ne $clientId) {
        throw "Tenant creation returned the wrong client_id."
      }

      $provisioned = Invoke-JsonPost "$BackendUrl/v1/clients/$clientId/provision" @{}
      if ($provisioned.client_id -ne $clientId) {
        throw "Tenant provisioning returned the wrong client_id."
      }

      $task = Invoke-JsonPost "$BackendUrl/v1/lead-desk/tasks" @{
        client_id = $clientId
        contact_name = "Verification Lead"
        company = "MAXX QA"
        email = "qa@example.com"
        phone = "+1-555-0199"
        message = "We need a smart-site Lead Desk verification pass for production readiness this week."
        requested_service = "lead-desk"
        budget_band = "10k+"
        timeline = "ASAP this week"
        preferred_channel = "email"
        source = "production-verification"
      }
      if (-not $task.task_id) {
        throw "Lead Desk task did not return a task_id."
      }

      $patched = Invoke-AuthorizedPatch "$BackendUrl/v1/lead-desk/tasks/$($task.task_id)" @{
        status = "completed"
        note = "Production verification marked this task complete."
      }
      $patchedTask = $patched.Content | ConvertFrom-Json
      if ($patchedTask.status -ne 'completed') {
        throw "Lead Desk task did not transition to completed."
      }

      $heartbeats = Invoke-JsonGet "$BackendUrl/v1/heartbeats"
      if (-not $heartbeats.heartbeats) {
        throw "Heartbeat endpoint did not return heartbeat summaries."
      }

      Write-Host "Verified tenant $clientId with task $($task.task_id)."
    }
  }

  if ($FrontendUrl) {
    $FrontendUrl = $FrontendUrl.TrimEnd('/')
    Invoke-Step "Frontend route smoke checks" {
      foreach ($path in @('/', '/dashboard/', '/tenants/', '/lead-desk/', '/deploy/')) {
        $url = "$FrontendUrl$path"
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
          throw "Frontend smoke check failed for $url with status $($response.StatusCode)."
        }
        Write-Host "$url -> $($response.StatusCode)"
      }
    }
  }

  Write-Host ""
  Write-Host "Production verification script finished."
} finally {
  Pop-Location
}
