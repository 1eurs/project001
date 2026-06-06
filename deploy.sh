#!/usr/bin/env bash
set -euo pipefail

PI_USER="${PI_USER:-pi}"
PI_HOST="${PI_HOST:-192.168.1.52}"
PI_DIR="${PI_DIR:-~/cafeqr}"
BASE_PATH="${BASE_PATH:-/serva}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building frontend with base: $BASE_PATH"
cd "$ROOT/frontend-react"
VITE_BASE_PATH="$BASE_PATH" npm run build

echo ""
echo "==> Syncing project to $PI_USER@$PI_HOST:$PI_DIR"
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'target/' \
  --exclude '.DS_Store' \
  --exclude '.claude/' \
  --exclude 'node_modules/' \
  --exclude 'frontend-react/node_modules/' \
  --exclude 'frontend-react/src/' \
  ../ pi@192.168.1.52:~/cafeqr/

echo ""
echo "==> Fixing permissions for nginx read access"
ssh "$PI_USER@$PI_HOST" "sudo chmod -R a+rX $PI_DIR/frontend-react/dist/ && sudo chmod a+X /home/$PI_USER"

echo ""
echo "==> Uploading nginx config for $BASE_PATH"
ssh "$PI_USER@$PI_HOST" "sudo tee /etc/nginx/snippets/cafeqr-paths.conf > /dev/null" <<'NGINX'
# Serva / CafeQR reverse proxy paths

# API backend
location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    client_max_body_size 50M;
}

# File uploads
location /files/ {
    proxy_pass http://127.0.0.1:8080/files/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    client_max_body_size 50M;
}

# SPA — Admin & Dashboard (built with base /serva)
location /serva {
    alias /home/pi/cafeqr/frontend-react/dist;
    try_files $uri $uri/ /serva/index.html;
    location ~ ^/serva/assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# SPA — Customer-facing routes (menu, cart, order tracking)
location /r/ {
    rewrite ^ /serva/index.html last;
}
location /cart {
    rewrite ^ /serva/index.html last;
}
location /order/ {
    rewrite ^ /serva/index.html last;
}
location /admin {
    rewrite ^ /serva/index.html last;
}
location /dashboard {
    rewrite ^ /serva/index.html last;
}
NGINX

echo ""
echo "==> Adding include to nginx default site (if missing)"
ssh "$PI_USER@$PI_HOST" "grep -q 'cafeqr-paths' /etc/nginx/sites-enabled/default || sudo sed -i '/include snippets\/law-stack-paths.conf;/a\    include snippets/cafeqr-paths.conf;' /etc/nginx/sites-enabled/default"

echo ""
echo "==> Testing nginx config"
ssh "$PI_USER@$PI_HOST" "sudo nginx -t"

echo ""
echo "==> Reloading nginx"
ssh "$PI_USER@$PI_HOST" "sudo systemctl reload nginx"

echo ""
echo "==> Rebuilding and restarting Docker containers"
ssh "$PI_USER@$PI_HOST" "cd $PI_DIR && docker compose up -d --build"

echo ""
echo "==> Waiting for backend health..."
sleep 10
for i in $(seq 1 12); do
  status=$(ssh "$PI_USER@$PI_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health" 2>/dev/null || true)
  if [ "$status" = "200" ]; then
    echo "Backend is UP (HTTP 200)"
    break
  fi
  echo "  attempt $i/12 — waiting..."
  sleep 5
done

echo ""
echo "==> Seeding demo data..."
cd "$ROOT/frontend-react"
API_BASE="http://$PI_HOST:8080" node scripts/seed.mjs

echo ""
echo "==> Done! Deployed at https://m7m2od.com$BASE_PATH"
