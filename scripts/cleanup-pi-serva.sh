#!/usr/bin/env bash
# Remove all Serva / CafeQR artifacts from the Pi.
# KEEP: m7m2od.com nginx sites, cloudflared (non-serva hostnames), other docker stacks.
set -euo pipefail

echo "==> Serva cleanup on $(hostname) as $(whoami)"

# --- Docker: CafeQR containers / images / volumes ---
if command -v docker >/dev/null 2>&1; then
  echo "==> Stopping CafeQR containers (if any)"
  docker rm -f cafeqr-backend cafeqr-db 2>/dev/null || true
  if [ -d "$HOME/cafeqr" ] && [ -f "$HOME/cafeqr/docker-compose.yml" ]; then
    (cd "$HOME/cafeqr" && docker compose down --remove-orphans 2>/dev/null) || true
  fi

  echo "==> Removing CafeQR images"
  docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | while read -r line; do
    name=${line%% *}
    id=${line##* }
    case "$name" in
      cafeqr-backend:*|cafeqr*:*)
        docker rmi -f "$id" 2>/dev/null || docker rmi -f "$name" 2>/dev/null || true
        ;;
    esac
  done
  # dangling from cafeqr builds
  docker image prune -f >/dev/null 2>&1 || true

  echo "==> Removing CafeQR volumes"
  for v in cafeqr_cafeqr-db-data cafeqr_cafeqr-uploads cafeqr_cafeqr-frontend-node-modules \
           cafeqr-db-data cafeqr-uploads; do
    docker volume rm -f "$v" 2>/dev/null || true
  done
  # any leftover matching cafeqr
  docker volume ls -q | grep -i cafeqr | while read -r v; do
    docker volume rm -f "$v" 2>/dev/null || true
  done
fi

# --- App directory & backups ---
echo "==> Removing ~/cafeqr and CafeQR backups"
rm -rf "$HOME/cafeqr"
rm -rf "$HOME/backups/cafeqr"
# stray export tarballs
rm -f "$HOME"/cafeqr-uploads*.tar.gz "$HOME"/cafeqr*.sql.gz 2>/dev/null || true

# --- nginx: serva.om site + cafeqr snippets ---
if [ -d /etc/nginx ]; then
  echo "==> Removing nginx Serva / CafeQR config"
  sudo rm -f /etc/nginx/sites-enabled/serva.om
  sudo rm -f /etc/nginx/sites-available/serva.om
  sudo rm -f /etc/nginx/snippets/cafeqr-paths.conf
  sudo rm -f /etc/nginx/conf.d/cafeqr-gzip.conf

  # Strip cafeqr includes from default (or any site) if present
  if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo sed -i '/cafeqr-paths/d' /etc/nginx/sites-enabled/default || true
  fi
  if [ -f /etc/nginx/sites-available/default ]; then
    sudo sed -i '/cafeqr-paths/d' /etc/nginx/sites-available/default || true
  fi

  echo "==> Testing nginx"
  sudo nginx -t
  sudo systemctl reload nginx
fi

# --- cloudflared: ensure no serva hostnames (idempotent) ---
if [ -f /etc/cloudflared/config.yml ]; then
  echo "==> Ensuring cloudflared has no serva.om hostnames"
  sudo cp -a /etc/cloudflared/config.yml "/etc/cloudflared/config.yml.bak.cleanup-$(date +%Y%m%d-%H%M%S)"
  sudo python3 - <<'PY'
from pathlib import Path
p = Path("/etc/cloudflared/config.yml")
lines = p.read_text().splitlines(True)
out = []
skip = 0
for line in lines:
    if skip:
        skip -= 1
        continue
    if "hostname: serva.om" in line or "hostname: www.serva.om" in line:
        skip = 1  # drop following service: line
        continue
    out.append(line)
text = "".join(out)
# collapse triple blank lines
while "\n\n\n" in text:
    text = text.replace("\n\n\n", "\n\n")
p.write_text(text)
print(p.read_text())
PY
  sudo systemctl restart cloudflared || true
  sleep 2
  systemctl is-active cloudflared || true
fi

# --- cron: remove cafeqr backup jobs ---
echo "==> Cleaning cron"
(crontab -l 2>/dev/null | grep -vi cafeqr | grep -vi serva || true) | crontab - 2>/dev/null || true
if sudo crontab -l >/dev/null 2>&1; then
  (sudo crontab -l 2>/dev/null | grep -vi cafeqr | grep -vi serva || true) | sudo crontab - 2>/dev/null || true
fi

# --- Summary: what remains (m7m2od stuff) ---
echo ""
echo "=== REMAINING (should be m7m2od-related) ==="
echo "-- docker --"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 2>/dev/null || true
echo "-- volumes --"
docker volume ls 2>/dev/null || true
echo "-- nginx sites --"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
echo "-- cloudflared --"
grep -E 'hostname:|service:' /etc/cloudflared/config.yml 2>/dev/null || true
echo "-- cafeqr leftovers? --"
ls -d "$HOME/cafeqr" 2>/dev/null && echo "WARN: ~/cafeqr still exists" || echo "OK: no ~/cafeqr"
docker ps -a --format '{{.Names}}' 2>/dev/null | grep -i cafeqr && echo "WARN: cafeqr containers" || echo "OK: no cafeqr containers"
grep -rni 'cafeqr\|serva.om' /etc/nginx/ 2>/dev/null && echo "WARN: nginx still mentions cafeqr/serva" || echo "OK: nginx clean of serva/cafeqr"

echo ""
echo "==> Pi Serva cleanup DONE. m7m2od.com sites/tunnel left intact."
