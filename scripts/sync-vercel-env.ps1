param(
  [string]$SecretFile = 'E:\THE PAULI FILES\agent-maxx-rotated-20260524.env',
  [string]$ProjectId,
  [string]$TeamId,
  [string[]]$Targets = @('production', 'preview'),
  [switch]$Apply,
  [switch]$DeployProduction
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

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

function Get-RequiredValue {
  param(
    [hashtable]$Values,
    [string]$Key
  )

  if (-not $Values.ContainsKey($Key) -or -not $Values[$Key]) {
    throw "Missing required key in private secret bundle: $Key"
  }
  return $Values[$Key]
}

function Get-VercelMetadata {
  $projectPath = Join-Path $root '.vercel\project.json'
  if (-not (Test-Path -LiteralPath $projectPath)) {
    throw ".vercel/project.json not found. Link the Vercel project before syncing env."
  }
  return Get-Content -Raw -LiteralPath $projectPath | ConvertFrom-Json
}

function Invoke-VercelEnvUpsert {
  param(
    [string]$Token,
    [string]$ResolvedProjectId,
    [string]$ResolvedTeamId,
    [string]$Key,
    [string]$Value,
    [string]$Type,
    [string[]]$ResolvedTargets
  )

  $headers = @{
    Authorization = "Bearer $Token"
    'Content-Type' = 'application/json'
  }
  $uri = "https://api.vercel.com/v10/projects/$ResolvedProjectId/env?teamId=$ResolvedTeamId&upsert=true"
  $body = @{
    key = $Key
    value = $Value
    type = $Type
    target = $ResolvedTargets
    comment = 'Agent MAXX rotated deployment value'
  } | ConvertTo-Json -Depth 8

  Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body -TimeoutSec 60 | Out-Null
}

$values = Read-SecretFile -Path $SecretFile
$metadata = Get-VercelMetadata
if (-not $ProjectId) {
  $ProjectId = $metadata.projectId
}
if (-not $TeamId) {
  $TeamId = $metadata.orgId
}
if (-not $ProjectId -or -not $TeamId) {
  throw "ProjectId and TeamId are required."
}

$token = $values['VERCEL_TOKEN']
if (-not $token) {
  $token = $values['VERCEL_API_TOKEN']
}
if (-not $token) {
  $token = $env:VERCEL_TOKEN
}
if (-not $token) {
  throw "Missing Vercel token. Add VERCEL_TOKEN to the private secret bundle or process environment."
}

$envSpecs = @(
  @{ Key = 'MAXX_BFF_URL'; Type = 'plain' },
  @{ Key = 'MAXX_BFF_SHARED_SECRET'; Type = 'sensitive' },
  @{ Key = 'MAXX_OPERATOR_PASSWORD'; Type = 'sensitive' },
  @{ Key = 'MAXX_OPERATOR_SESSION_SECRET'; Type = 'sensitive' },
  @{ Key = 'MAXX_ALLOW_LOCAL_BFF_IN_PRODUCTION'; Type = 'plain' }
)

if (-not $Apply) {
  Write-Host "Dry run only. Add -Apply to sync Vercel env values."
  Write-Host "Project: $ProjectId"
  Write-Host "Targets: $($Targets -join ',')"
  Write-Host "Keys:"
  foreach ($spec in $envSpecs) {
    Get-RequiredValue -Values $values -Key $spec.Key | Out-Null
    Write-Host "- $($spec.Key) [$($spec.Type)]"
  }
  exit 0
}

foreach ($spec in $envSpecs) {
  $value = Get-RequiredValue -Values $values -Key $spec.Key
  Invoke-VercelEnvUpsert `
    -Token $token `
    -ResolvedProjectId $ProjectId `
    -ResolvedTeamId $TeamId `
    -Key $spec.Key `
    -Value $value `
    -Type $spec.Type `
    -ResolvedTargets $Targets
  Write-Host "Synced Vercel env $($spec.Key) for $($Targets -join ',')"
}

if ($DeployProduction) {
  $env:VERCEL_TOKEN = $token
  Push-Location $root
  try {
    npx vercel deploy --prod --yes --token $token
    if ($LASTEXITCODE -ne 0) {
      throw "Vercel production deploy failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
    Remove-Item Env:\VERCEL_TOKEN -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "Env sync complete. Redeploy Vercel production so server routes receive the new values."
}
