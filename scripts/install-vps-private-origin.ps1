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
sudo apt-get install -y nginx curl

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

if [ "`$ATTEMPT_TLS" = "True" ]; then
  echo "Attempting Let's Encrypt TLS for $OriginHost..."
  sudo apt-get install -y certbot python3-certbot-nginx
  if sudo certbot --nginx -d "$OriginHost" --register-unsafely-without-email --agree-tos --redirect --non-interactive; then
    echo "TLS enabled for https://$OriginHost"
  else
    echo "WARNING: TLS setup failed. If using sslip.io, this may be a shared-domain Let's Encrypt rate limit. HTTP origin remains available."
  fi
fi

if [ "`$APPLY_FIREWALL" = "True" ]; then
  echo "Applying direct-port closure. SSH, HTTP, and HTTPS stay open; direct BFF/worker ports are denied."
  echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
  echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent

  for PORT in 22 80 443; do
    sudo iptables -C INPUT -p tcp --dport "`$PORT" -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport "`$PORT" -j ACCEPT
  done

  PUBLIC_IFACE="`$(ip route get 1.1.1.1 | sed -n 's/.* dev \([^ ]*\).*/\1/p' | head -n1)"
  if [ -n "`$PUBLIC_IFACE" ]; then
    for PORT in 8010 8020; do
      sudo iptables -D INPUT -p tcp --dport "`$PORT" -j DROP 2>/dev/null || true
      sudo iptables -C INPUT -i "`$PUBLIC_IFACE" -p tcp --dport "`$PORT" -j DROP 2>/dev/null || sudo iptables -I INPUT 1 -i "`$PUBLIC_IFACE" -p tcp --dport "`$PORT" -j DROP
    done
  else
    echo "WARNING: Could not identify public interface for INPUT direct-port closure."
  fi

  if [ -n "`$PUBLIC_IFACE" ] && sudo iptables -S DOCKER-USER >/dev/null 2>&1; then
    echo "Applying Docker published-port closure on interface `$PUBLIC_IFACE for ports 8010 and 8020."
    sudo iptables -C DOCKER-USER -i "`$PUBLIC_IFACE" -p tcp -m multiport --dports 8010,8020 -j DROP 2>/dev/null || sudo iptables -I DOCKER-USER 1 -i "`$PUBLIC_IFACE" -p tcp -m multiport --dports 8010,8020 -j DROP
  else
    echo "WARNING: Could not identify public interface or DOCKER-USER chain; Docker published ports may still bypass INPUT rules."
  fi

  sudo mkdir -p /etc/iptables
  sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
  sudo netfilter-persistent save
  sudo iptables -S INPUT | grep -E -- '--dport (22|80|443|8010|8020)' || true
  sudo iptables -S DOCKER-USER || true
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
Write-Host "powershell -ExecutionPolicy Bypass -File scripts/check-vps-network-exposure.ps1 -BackendUrl `"http://$OriginHost`" -DirectBackendUrl `"http://$($VpsIp):8010`" -DirectBrowserWorkerUrl `"http://$($VpsIp):8020`" -ExpectedMode private-required"
