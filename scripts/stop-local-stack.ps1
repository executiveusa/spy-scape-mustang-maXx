$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$runtimeStateDir = Join-Path $root '.stack-runtime'
$frontendPidFile = Join-Path $runtimeStateDir 'frontend-wrapper.pid'
$backendPidFile = Join-Path $runtimeStateDir 'backend-wrapper.pid'

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

function Stop-PidFileProcess {
  param([string]$PidFile)

  if (-not (Test-Path $PidFile)) {
    return
  }

  try {
    $processId = [int](Get-Content $PidFile -Raw).Trim()
    if ($processId -gt 0) {
      Stop-ProcessTree -ProcessId $processId
      Write-Host "Stopped wrapper process $processId"
    }
  } catch {
  } finally {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
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

    Write-Host "Stopped process on port $Port"
  } else {
    Write-Host "No listener found on port $Port"
  }
}

function Stop-LegacyRepoProcesses {
  $legacyProcesses = Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and $_.Name -in 'powershell.exe', 'cmd.exe', 'node.exe', 'python.exe' -and (
        $_.CommandLine -match 'maxx_bff\.main:app' -or
        $_.CommandLine -match 'start-local-stack\.ps1' -or
        $_.CommandLine -match 'stop-local-stack\.ps1' -or
        $_.CommandLine -match 'set PORT=3011' -or
        $_.CommandLine -match '\\\.next\\standalone.*server\.js' -or
        $_.CommandLine -match 'node\.exe"\s+server\.js' -or
        $_.CommandLine -match 'next\\dist\\bin\\next"\s+build'
      )
    }

  foreach ($process in $legacyProcesses) {
    if ($process.ProcessId -and $process.ProcessId -ne $PID) {
      Stop-ProcessTree -ProcessId $process.ProcessId
    }
  }
}

Stop-PidFileProcess -PidFile $frontendPidFile
Stop-PidFileProcess -PidFile $backendPidFile
Stop-LegacyRepoProcesses
Stop-PortProcess -Port 3011
Stop-PortProcess -Port 8010
