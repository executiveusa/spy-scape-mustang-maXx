param(
  [Parameter(Mandatory = $true)]
  [string]$BackupArchive,
  [string]$SshTarget = $env:MAXX_VPS_SSH_TARGET
)

$ErrorActionPreference = 'Stop'

if (-not $SshTarget) {
  throw "Set MAXX_VPS_SSH_TARGET or pass -SshTarget, for example ubuntu@31.220.58.212."
}
if (-not (Test-Path $BackupArchive)) {
  throw "Backup archive not found: $BackupArchive"
}

$archiveName = Split-Path -Leaf $BackupArchive
$remoteArchive = "/tmp/$archiveName"

Write-Host "Uploading backup archive..."
scp $BackupArchive "${SshTarget}:$remoteArchive"

Write-Host "Restoring /data/maxx and /runtime/hermes on VPS..."
ssh $SshTarget "sudo mkdir -p /data/maxx /runtime/hermes && sudo tar -xzf $remoteArchive -C / && sudo rm -f $remoteArchive"

Write-Host "Restore finished. Redeploy or restart the Coolify backend before verification."
