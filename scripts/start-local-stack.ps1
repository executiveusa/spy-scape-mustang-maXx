$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$frontendPort = 3011
$backendPort = 8010
$frontendLog = Join-Path $root 'next-start-3011.log'
$backendLog = Join-Path $root 'backend\uvicorn-8010.log'
$backendErrorLog = Join-Path $root 'backend\uvicorn-8010-error.log'
$frontendErrorLog = Join-Path $root 'next-start-3011-error.log'
$backendPython = Join-Path $root 'backend\.venv\Scripts\python.exe'
$nodeBinary = (Get-Command node.exe -ErrorAction Stop).Source
$npmBinary = (Get-Command npm.cmd -ErrorAction Stop).Source
$standaloneServer = Join-Path $root '.next\standalone\server.js'
$standaloneRoot = Join-Path $root '.next\standalone'
$runtimeStateDir = Join-Path $root '.stack-runtime'
$frontendPidFile = Join-Path $runtimeStateDir 'frontend-wrapper.pid'
$backendPidFile = Join-Path $runtimeStateDir 'backend-wrapper.pid'
$webpackCacheDir = Join-Path $root '.next\cache\webpack'

function Wait-ForPortFree {
  param(
    [int]$Port,
    [int]$Attempts = 20,
    [int]$DelaySeconds = 1
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    $connections = Get-ListeningProcessIds -Port $Port
    if (-not $connections) {
      return $true
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
}

function Get-ListeningProcessIds {
  param([int]$Port)

  $pattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
  $lines = netstat -ano -p tcp 2>$null
  $processIds = @()

  foreach ($line in $lines) {
    if ($line -match $pattern) {
      $processIds += [int]$Matches[1]
    }
  }

  return $processIds | Select-Object -Unique
}

function Stop-ProcessTree {
  param([int]$ProcessId)

  if ($ProcessId -and $ProcessId -gt 0) {
    cmd.exe /c "taskkill /PID $ProcessId /T /F >nul 2>&1" | Out-Null
    Start-Sleep -Milliseconds 400

    $stillRunning = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($stillRunning) {
      Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Stop-PortProcess {
  param([int]$Port)

  $connections = Get-ListeningProcessIds -Port $Port
  if ($connections) {
    foreach ($processId in $connections) {
      if ($processId -and $processId -gt 0) {
        Stop-ProcessTree -ProcessId $processId
      }
    }

    if (-not (Wait-ForPortFree -Port $Port)) {
      throw "Port $Port did not free after stopping the owning process."
    }
  }
}

function Stop-RepoNodeProcess {
  param([string]$Pattern)

  $processes = Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -eq 'node.exe' -and
      $_.CommandLine -and
      $_.CommandLine -match [regex]::Escape($root) -and
      $_.CommandLine -match $Pattern
    }

  foreach ($process in $processes) {
    if ($process.ProcessId -and $process.ProcessId -gt 0) {
      Stop-ProcessTree -ProcessId $process.ProcessId
    }
  }
}

function Stop-PidFileProcess {
  param([string]$PidFile)

  if (-not (Test-Path $PidFile)) {
    return
  }

  try {
    $processId = [int](Get-Content $PidFile -Raw).Trim()
    if ($processId -gt 0) {
      Stop-ProcessTree -ProcessId $processId
    }
  } catch {
  } finally {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "== Agent MAXX local stack =="
Write-Host "root: $root"

New-Item -ItemType Directory -Path $runtimeStateDir -Force | Out-Null

Stop-PidFileProcess -PidFile $frontendPidFile
Stop-PidFileProcess -PidFile $backendPidFile
Stop-PortProcess -Port $frontendPort
Stop-PortProcess -Port $backendPort
Stop-RepoNodeProcess -Pattern 'next\\dist\\bin\\next"\s+build'
Stop-RepoNodeProcess -Pattern 'npm-cli\.js"\s+run\s+build'

if (-not (Test-Path $backendPython)) {
  Write-Host "Creating backend virtual environment..."
  py -3 -m venv (Join-Path $root 'backend\.venv')
  & $backendPython -m pip install -r (Join-Path $root 'backend\requirements.txt')
}

if (Test-Path $webpackCacheDir) {
  $stalePackFiles = Get-ChildItem -Path $webpackCacheDir -Recurse -Filter '*.pack_' -ErrorAction SilentlyContinue
  if ($stalePackFiles) {
    Write-Host "Clearing flaky webpack cache..."
    Remove-Item $webpackCacheDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Building frontend..."
Push-Location $root
npm run build
Pop-Location

$useStandalone = Test-Path $standaloneServer

if ($useStandalone) {
  $standalonePublic = Join-Path $standaloneRoot 'public'
  $standaloneStatic = Join-Path $standaloneRoot '.next\static'

  if (Test-Path $standalonePublic) { Remove-Item $standalonePublic -Recurse -Force }
  if (Test-Path $standaloneStatic) { Remove-Item $standaloneStatic -Recurse -Force }

  Copy-Item -Path (Join-Path $root 'public') -Destination $standalonePublic -Recurse -Force
  New-Item -ItemType Directory -Path (Join-Path $standaloneRoot '.next') -Force | Out-Null
  Copy-Item -Path (Join-Path $root '.next\static') -Destination $standaloneStatic -Recurse -Force
} else {
  Write-Host "Standalone bundle missing; falling back to next start."
}

if (Test-Path $frontendLog) { Remove-Item $frontendLog -Force }
if (Test-Path $backendLog) { Remove-Item $backendLog -Force }
if (Test-Path $frontendErrorLog) { Remove-Item $frontendErrorLog -Force }
if (Test-Path $backendErrorLog) { Remove-Item $backendErrorLog -Force }

$backendProcess = Start-Process `
  -FilePath $backendPython `
  -WorkingDirectory (Join-Path $root 'backend') `
  -ArgumentList '-m', 'uvicorn', 'maxx_bff.main:app', '--host', '127.0.0.1', '--port', "$backendPort" `
  -RedirectStandardOutput $backendLog `
  -RedirectStandardError $backendErrorLog `
  -WindowStyle Hidden `
  -PassThru

if ($useStandalone) {
  $frontendCommand = "set PORT=$frontendPort&& set HOSTNAME=127.0.0.1&& `"$nodeBinary`" server.js 1> `"$frontendLog`" 2> `"$frontendErrorLog`""
  $frontendProcess = Start-Process `
    -FilePath 'cmd.exe' `
    -WorkingDirectory $standaloneRoot `
    -ArgumentList '/c', $frontendCommand `
    -WindowStyle Hidden `
    -PassThru
} else {
  $frontendCommand = "set PORT=$frontendPort&& set HOSTNAME=127.0.0.1&& `"$npmBinary`" run start 1> `"$frontendLog`" 2> `"$frontendErrorLog`""
  $frontendProcess = Start-Process `
    -FilePath 'cmd.exe' `
    -WorkingDirectory $root `
    -ArgumentList '/c', $frontendCommand `
    -WindowStyle Hidden `
    -PassThru
}

Set-Content -Path $backendPidFile -Value $backendProcess.Id
Set-Content -Path $frontendPidFile -Value $frontendProcess.Id

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$Attempts = 20,
    [int]$DelaySeconds = 2
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    $conn = Get-ListeningProcessIds -Port $Port
    if ($conn) { return $conn }
    Start-Sleep -Seconds $DelaySeconds
  }

  return $null
}

$frontendConn = Wait-ForPort -Port $frontendPort
$backendConn = Wait-ForPort -Port $backendPort

if (-not $frontendConn) { throw "Frontend did not bind to port $frontendPort" }
if (-not $backendConn) { throw "Backend did not bind to port $backendPort" }

Write-Host "Frontend: http://127.0.0.1:$frontendPort"
Write-Host "Dashboard: http://127.0.0.1:$frontendPort/dashboard"
Write-Host "Backend: http://127.0.0.1:$backendPort"
Write-Host "Frontend log: $frontendLog"
Write-Host "Backend log: $backendLog"
