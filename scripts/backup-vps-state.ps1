param(
  [string]$SshTarget = $env:MAXX_VPS_SSH_TARGET,
  [string]$OutputDir = ".\backups"
)

$ErrorActionPreference = 'Stop'

if (-not $SshTarget) {
  throw "Set MAXX_VPS_SSH_TARGET or pass -SshTarget, for example ubuntu@31.220.58.212."
}

$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
$resolvedOutput = Resolve-Path -Path (New-Item -ItemType Directory -Force -Path $OutputDir)
$archiveName = "agent-maxx-vps-state-$stamp.tgz"
$remoteArchive = "/tmp/$archiveName"
$localArchive = Join-Path $resolvedOutput $archiveName

Write-Host "Creating VPS backup for /data/maxx and /runtime/hermes..."
ssh $SshTarget "sudo tar -czf $remoteArchive /data/maxx /runtime/hermes"
scp "${SshTarget}:$remoteArchive" $localArchive
ssh $SshTarget "rm -f $remoteArchive"

Write-Host "Backup written to $localArchive"
