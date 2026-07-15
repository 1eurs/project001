#!/usr/bin/env bash
set -euo pipefail

# Deploys Serva to serva-vps (Hetzner, x86_64) — the current production host.
# Builds the frontend locally (no node/npm on the VPS), rsyncs source + the
# built frontend to /opt/cafeqr, and builds the backend image natively on
# the VPS itself (no cross-arch emulation needed, unlike the old Pi flow).
#
# Never touches the remote .env wholesale — secrets there are prod-only and
# must not be clobbered by whatever's in the local .env.

VPS_HOST="${VPS_HOST:-serva-vps}"   # SSH alias (already has the right user/key)
VPS_DIR="${VPS_DIR:-/opt/cafeqr}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building frontend"
cd "$ROOT/frontend-react"
npm run build
cd "$ROOT"

echo ""
echo "==> Syncing backend source + compose files to $VPS_HOST:$VPS_DIR"
rsync -avz --delete \
  --exclude '.git' --exclude '.DS_Store' --exclude '.claude' --exclude '.agents' \
  --exclude 'target' --exclude 'node_modules' --exclude 'dist' \
  "$ROOT/src" "$ROOT/pom.xml" "$ROOT/Dockerfile" "$ROOT/.dockerignore" \
  "$ROOT/docker-compose.yml" \
  "$VPS_HOST:$VPS_DIR/"

echo ""
echo "==> Syncing built frontend"
rsync -avz --delete "$ROOT/frontend-react/dist/" "$VPS_HOST:$VPS_DIR/frontend-react/dist/"

echo ""
echo "==> Verifying POSTGRES_PASSWORD is present in the remote .env"
ssh "$VPS_HOST" "grep -q '^POSTGRES_PASSWORD=' $VPS_DIR/.env" || {
  echo "ERROR: remote .env has no POSTGRES_PASSWORD set." >&2
  echo "docker-compose.yml now requires it — set it (matching the live DB password) before deploying." >&2
  exit 1
}

echo ""
echo "==> Building backend image natively on the VPS (x86_64)"
ssh "$VPS_HOST" "cd $VPS_DIR && docker compose build backend"

echo ""
echo "==> Restarting containers"
ssh "$VPS_HOST" "cd $VPS_DIR && docker compose up -d"

echo ""
echo "==> Waiting for backend health..."
healthy=false
for i in $(seq 1 12); do
  status=$(ssh "$VPS_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health" 2>/dev/null || true)
  if [ "$status" = "200" ]; then
    echo "Backend is UP (HTTP 200)"
    healthy=true
    break
  fi
  echo "  attempt $i/12 — waiting..."
  sleep 5
done
if [ "$healthy" != "true" ]; then
  echo "Backend failed its health check; recent logs:" >&2
  ssh "$VPS_HOST" "cd $VPS_DIR && docker compose logs --tail=100 backend" >&2 || true
  exit 1
fi

echo ""
echo "==> Removing superseded images and obsolete build cache"
ssh "$VPS_HOST" "docker image prune -f && docker builder prune -af"

echo ""
echo "==> Done! Deployed at https://serva.om"
