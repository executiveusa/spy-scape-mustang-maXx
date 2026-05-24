param(
  [string]$BackendUrl = $env:MAXX_VERIFY_BACKEND_URL,
  [string]$FrontendUrl = $env:MAXX_VERIFY_FRONTEND_URL,
  [string]$BrowserWorkerUrl = $env:MAXX_VERIFY_BROWSER_WORKER_URL,
  [string]$BffSharedSecret = $env:MAXX_BFF_SHARED_SECRET,
  [string]$OperatorPassword = $env:MAXX_OPERATOR_PASSWORD,
  [string]$SecretFile,
  [ValidateSet('controlled-demo', 'private-required')]
  [string]$NetworkExpectedMode = 'controlled-demo',
  [switch]$CheckVpsNetworkExposure,
  [switch]$RequireLiveStack,
  [switch]$RequireMaxxRuntimeExecutionReady,
  [switch]$RequireHermesExecutionReady,
  [switch]$RunVisualInspection
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

function Import-VerificationSecretFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Secret file not found: $Path"
  }

  $allowedKeys = @(
    'MAXX_BFF_URL',
    'MAXX_VERIFY_BACKEND_URL',
    'MAXX_VERIFY_FRONTEND_URL',
    'MAXX_VERIFY_BROWSER_WORKER_URL',
    'MAXX_BFF_SHARED_SECRET',
    'MAXX_OPERATOR_PASSWORD'
  )

  $loaded = 0
  $raw = Get-Content -Raw -LiteralPath $Path
  foreach ($line in ($raw -split "`r?`n")) {
    $trim = $line.Trim()
    if (-not $trim -or $trim.StartsWith('#') -or -not ($trim -match '=')) {
      continue
    }

    $parts = $trim -split '=', 2
    $key = $parts[0].Trim()
    if ($allowedKeys -notcontains $key) {
      continue
    }

    [Environment]::SetEnvironmentVariable($key, $parts[1].Trim(), 'Process')
    $loaded += 1
  }

  return $loaded
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
  if ($SecretFile) {
    $loadedSecretKeys = Import-VerificationSecretFile -Path $SecretFile
    Write-Host "Loaded $loadedSecretKeys verification env value(s) from secret file."

    if (-not $BackendUrl) {
      $BackendUrl = if ($env:MAXX_VERIFY_BACKEND_URL) { $env:MAXX_VERIFY_BACKEND_URL } else { $env:MAXX_BFF_URL }
    }
    if (-not $FrontendUrl) {
      $FrontendUrl = $env:MAXX_VERIFY_FRONTEND_URL
    }
    if (-not $BrowserWorkerUrl) {
      $BrowserWorkerUrl = $env:MAXX_VERIFY_BROWSER_WORKER_URL
    }
    if (-not $BffSharedSecret) {
      $BffSharedSecret = $env:MAXX_BFF_SHARED_SECRET
    }
    if (-not $OperatorPassword) {
      $OperatorPassword = $env:MAXX_OPERATOR_PASSWORD
    }
  }

  Invoke-Step "Backend integration tests" {
    py -3 -m unittest backend\tests\test_maxx_bff.py -v
    if ($LASTEXITCODE -ne 0) {
      throw "Backend integration tests failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Browser worker tests" {
    py -3 -m unittest backend\tests\test_browser_worker.py -v
    if ($LASTEXITCODE -ne 0) {
      throw "Browser worker tests failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Operator auth contract" {
    npm run test:operator-auth
    if ($LASTEXITCODE -ne 0) {
      throw "Operator auth contract failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Smart-site story contract" {
    npm run test:smart-site-story
    if ($LASTEXITCODE -ne 0) {
      throw "Smart-site story contract failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Launch ops contract" {
    npm run test:launch-ops
    if ($LASTEXITCODE -ne 0) {
      throw "Launch ops contract failed with exit code $LASTEXITCODE."
    }
  }

  Invoke-Step "Agent MAXX visible identity contract" {
    npm run test:maxx-visible-identity
    if ($LASTEXITCODE -ne 0) {
      throw "Agent MAXX visible identity contract failed with exit code $LASTEXITCODE."
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

  if ($CheckVpsNetworkExposure) {
    Invoke-Step "VPS network exposure gate" {
      $args = @(
        '-BackendUrl', $BackendUrl,
        '-ExpectedMode', $NetworkExpectedMode
      )
      if ($BrowserWorkerUrl) {
        $args += @('-BrowserWorkerUrl', $BrowserWorkerUrl)
      }
      if ($SecretFile) {
        $args += @('-SecretFile', $SecretFile)
      }
      if ($BffSharedSecret) {
        $args += @('-BffSharedSecret', $BffSharedSecret)
      }

      & "$PSScriptRoot\check-vps-network-exposure.ps1" @args
      if ($LASTEXITCODE -ne 0) {
        throw "VPS network exposure gate failed with exit code $LASTEXITCODE."
      }
    }
  }

  $backendReachable = $false
  try {
    Invoke-Step "BFF health smoke check" {
      $health = Invoke-JsonGet "$BackendUrl/health"
      if (-not $health.service -or $health.service -ne 'agent-maxx-bff') {
        throw "Unexpected BFF health payload from $BackendUrl/health"
      }
      Write-Host "BFF status: $($health.status); runtime: $($health.runtime)"
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
          Invoke-WebRequest -UseBasicParsing -Uri "$BackendUrl/v1/maxx/runtime/health" -TimeoutSec 15 | Out-Null
          throw "Unauthenticated /v1/maxx/runtime/health unexpectedly succeeded."
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

    Invoke-Step "Agent MAXX runtime readiness" {
      $runtime = Invoke-JsonGet "$BackendUrl/v1/maxx/runtime/health"
      Write-Host "Agent MAXX runtime status: $($runtime.status); execution_ready: $($runtime.execution_ready)"
      if (($RequireMaxxRuntimeExecutionReady -or $RequireHermesExecutionReady) -and -not $runtime.execution_ready) {
        throw "Agent MAXX runtime execution_ready is false. Resolve runtime path and provider credentials before launch."
      }
    }

    Invoke-Step "Agent MAXX wrapper readiness" {
      $readiness = Invoke-JsonGet "$BackendUrl/v1/maxx/readiness"
      if ($readiness.runtime_wrapper.base_runtime -ne 'Agent MAXX Runtime') {
        throw "MAXX readiness endpoint did not report Agent MAXX Runtime as the base runtime."
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

    Invoke-Step "Lead Acquisition safe canary" {
      $sources = Invoke-JsonGet "$BackendUrl/v1/lead-acquisition/sources"
      if (-not $sources.sources) {
        throw "Lead Acquisition sources endpoint did not return source health."
      }

      $job = Invoke-JsonPost "$BackendUrl/v1/lead-acquisition/jobs" @{
        client_id = "maxx-demo"
        source = "authorized-contact-import"
        query = "Production verification owner-approved prospect."
        max_records = 1
        prospects = @(
          @{
            name = "Verification Prospect"
            title = "Founder"
            company = "MAXX Verification Prospect Co"
            email = "verify-prospect@example.com"
            phone = "+1-555-0101"
            location = "Austin"
            seniority = "Founder"
            department = "Executive"
            organization_domain = "verification-prospect.example"
            notes = "Owner-approved verification prospect for Lead Acquisition canary."
          }
        )
      }
      if ($job.discovered_count -lt 1) {
        throw "Lead Acquisition canary did not discover a prospect."
      }

      $prospects = Invoke-JsonGet "$BackendUrl/v1/lead-acquisition/prospects?client_id=maxx-demo"
      $candidate = @($prospects.prospects | Where-Object { $_.job_id -eq $job.job_id } | Select-Object -First 1)
      if (-not $candidate -or -not $candidate.prospect_id) {
        throw "Lead Acquisition prospect was not persisted."
      }

      $promotion = Invoke-JsonPost "$BackendUrl/v1/lead-acquisition/prospects/$($candidate.prospect_id)/promote" @{
        note = "Production verification approved this prospect for Lead Desk review."
        preferred_channel = "email"
      }
      if (-not $promotion.lead_desk_task.task_id) {
        throw "Lead Acquisition promotion did not create a Lead Desk task."
      }
      Write-Host "Verified Lead Acquisition job $($job.job_id) with task $($promotion.lead_desk_task.task_id)."
    }
  }

  if ($BrowserWorkerUrl) {
    $BrowserWorkerUrl = $BrowserWorkerUrl.TrimEnd('/')
    Invoke-Step "Browser worker live health" {
      $workerHealth = Invoke-JsonGet "$BrowserWorkerUrl/health"
      if ($workerHealth.service -ne 'agent-maxx-browser-worker') {
        throw "Unexpected browser worker health payload from $BrowserWorkerUrl/health"
      }
      if (-not $workerHealth.secret_configured) {
        throw "Browser worker secret is not configured."
      }
      if ($workerHealth.allowed_domains -contains '*') {
        throw "Browser worker allowed domains must not contain '*'."
      }
      Write-Host "Browser worker status: $($workerHealth.status); autonomy: $($workerHealth.autonomy_enabled)"
    }
  }

  if ($FrontendUrl) {
    $FrontendUrl = $FrontendUrl.TrimEnd('/')
    Invoke-Step "Frontend route smoke checks" {
      foreach ($path in @('/', '/api/health/', '/api/smart-site-story/')) {
        $url = "$FrontendUrl$path"
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 20
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
          throw "Frontend smoke check failed for $url with status $($response.StatusCode)."
        }
        Write-Host "$url -> $($response.StatusCode)"
      }
    }

    Invoke-Step "Operator-protected frontend checks" {
      foreach ($path in @('/api/runtime/', '/api/tenants/', '/api/lead-desk/', '/api/lead-acquisition/')) {
        try {
          Invoke-WebRequest -UseBasicParsing -Uri "$FrontendUrl$path" -TimeoutSec 20 | Out-Null
          throw "Unauthenticated $path unexpectedly succeeded."
        } catch {
          if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) {
            Write-Host "$path rejects unauthenticated requests."
          } else {
            throw
          }
        }
      }

      if ($OperatorPassword) {
        $scriptBlock = @'
const base = process.env.MAXX_VERIFY_FRONTEND_URL.replace(/\/$/, '');
const password = process.env.MAXX_OPERATOR_PASSWORD;

(async () => {
  const login = await fetch(`${base}/api/operator-session/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password, tenant_id: 'maxx-demo' }),
    redirect: 'manual',
  });
  if (login.status !== 200) {
    throw new Error(`operator-session returned ${login.status}`);
  }
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) {
    throw new Error('operator-session did not return a cookie');
  }
  for (const path of ['/dashboard/', '/lead-desk/', '/lead-acquisition/', '/api/runtime/', '/api/lead-desk/', '/api/lead-acquisition/']) {
    const response = await fetch(`${base}${path}`, { headers: { cookie }, redirect: 'manual' });
    if (response.status !== 200) {
      throw new Error(`${path} returned ${response.status} after operator login`);
    }
    console.log(`${path} -> ${response.status}`);
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
'@
        $env:MAXX_VERIFY_FRONTEND_URL = $FrontendUrl
        $env:MAXX_OPERATOR_PASSWORD = $OperatorPassword
        $scriptBlock | node -
        if ($LASTEXITCODE -ne 0) {
          throw "Operator login smoke failed with exit code $LASTEXITCODE."
        }
      } else {
        Write-Warning "MAXX_OPERATOR_PASSWORD is not set; skipping authenticated operator smoke."
      }
    }

    if ($RunVisualInspection) {
      Invoke-Step "Frontend visual inspection" {
        $previousVisualBaseUrl = $env:MAXX_VISUAL_BASE_URL
        $env:MAXX_VISUAL_BASE_URL = $FrontendUrl
        try {
          npm run verify:visual
          if ($LASTEXITCODE -ne 0) {
            throw "Visual inspection failed with exit code $LASTEXITCODE."
          }
        } finally {
          $env:MAXX_VISUAL_BASE_URL = $previousVisualBaseUrl
        }
      }
    }
  } elseif ($RunVisualInspection) {
    throw "RunVisualInspection requires -FrontendUrl or MAXX_VERIFY_FRONTEND_URL."
  }

  Write-Host ""
  Write-Host "Production verification script finished."
} finally {
  Pop-Location
}
