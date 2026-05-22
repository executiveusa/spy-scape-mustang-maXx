param(
  [string]$SshTarget = $env:MAXX_VPS_SSH_TARGET,
  [string]$VpsIp = '31.220.58.212',
  [string]$OriginHost,
  [switch]$AttemptTls,
  [switch]$ApplyFirewall,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $OriginHost) {
  $OriginHost = "maxx-api.$VpsIp.sslip.io"
}

if (-not $SshTarget) {
  $SshTarget = "root@$VpsIp"
}

Write-Host "Agent MAXX private-origin installer"
Write-Host "SSH target: $SshTarget"
Write-Host "Origin host: $OriginHost"
Write-Host "TLS attempt: $($AttemptTls.IsPresent)"
Write-Host "Firewall mode: $($ApplyFirewall.IsPresent)"

$remoteScript = @"
set -euo pipefail

ORIGIN_HOST="$OriginHost"
APPLY_FIREWALL="$($ApplyFirewall.IsPresent)"
ATTEMPT_TLS="$($AttemptTls.IsPresent)"

echo "Installing Nginx private-origin proxy for Agent MAXX..."
sudo apt-get update
sudo apt-get install -y nginx curl ufw

sudo tee /etc/nginx/sites-available/agent-maxx-private-origin >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $OriginHost;

    client_max_body_size 10m;

    location /health {
        proxy_pass http://127.0.0.1:8010;
        proxy_http_version 1.1;
        proxy_set_header Host 127.0.0.1:8010;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:8010;
        proxy_http_version 1.1;
        proxy_set_header Host 127.0.0.1:8010;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }

    location / {
        default_type text/plain;
        return 200 "Agent MAXX private origin is online. Use the Vercel smart-site for operator access.";
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/agent-maxx-private-origin /etc/nginx/sites-enabled/agent-maxx-private-origin
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo "Checking loopback and named-origin health..."
curl --fail --silent --show-error http://127.0.0.1:8010/health >/tmp/maxx-bff-loopback-health.json
curl --fail --silent --show-error -H "Host: $OriginHost" http://127.0.0.1/health >/tmp/maxx-bff-origin-health.json
echo "Nginx private-origin HTTP proxy is healthy."

if [ "$ATTEMPT_TLS" = "True" ]; then
  echo "Attempting Let's Encrypt TLS for $OriginHost..."
  sudo apt-get install -y certbot python3-certbot-nginx
  if sudo certbot --nginx -d "$OriginHost" --register-unsafely-without-email --agree-tos --redirect --non-interactive; then
    echo "TLS enabled for https://$OriginHost"
  else
    echo "WARNING: TLS setup failed. If using sslip.io, this may be a shared-domain Let's Encrypt rate limit. HTTP origin remains available."
  fi
fi

if [ "$APPLY_FIREWALL" = "True" ]; then
  echo "Applying direct-port closure. SSH, HTTP, and HTTPS stay open; direct BFF/worker ports are denied."
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw deny 8010/tcp
  sudo ufw deny 8020/tcp
  sudo ufw --force enable
  sudo ufw status verbose
else
  echo "Firewall changes skipped. Re-run with -ApplyFirewall after Vercel uses the named origin."
fi

echo "Named origin: http://$OriginHost"
"@

if ($DryRun) {
  Write-Host $remoteScript
  exit 0
}

$remoteScript | ssh $SshTarget 'bash -s'

Write-Host ""
Write-Host "Set Vercel env:"
Write-Host "MAXX_BFF_URL=http://$OriginHost"
Write-Host ""
Write-Host "Then redeploy Vercel and run:"
Write-Host "powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 -BackendUrl `"http://$OriginHost`" -DirectBackendUrl `"http://$VpsIp:8010`" -DirectBrowserWorkerUrl `"http://$VpsIp:8020`" -ExpectedMode private-required"
