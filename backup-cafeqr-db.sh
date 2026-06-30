#!/usr/bin/env bash
# Nightly Postgres backup for cafeqr. Stored outside ~/cafeqr so deploy.sh
# (rsync --delete) never touches it. Keeps last 14 dumps.
set -euo pipefail
BACKUP_DIR=/home/pi/backups/cafeqr
KEEP=14
STAMP=$(date +%Y%m%d-%H%M%S)
TMP="$BACKUP_DIR/.cafeqr-$STAMP.sql.gz.tmp"
DEST="$BACKUP_DIR/cafeqr-$STAMP.sql.gz"
LOG="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"
# pg_custom-free plain dump, compressed. pipefail catches pg_dump failure.
if docker exec cafeqr-db pg_dump -U cafeqr -d cafeqr | gzip > "$TMP"; then
  # sanity: gzip must be non-trivial (a failed dump yields a tiny file)
  if [ "$(stat -c%s "$TMP")" -gt 200 ]; then
    mv "$TMP" "$DEST"
    echo "$(date -Is) OK   $DEST ($(stat -c%s "$DEST") bytes)" >> "$LOG"
  else
    rm -f "$TMP"
    echo "$(date -Is) FAIL dump too small, discarded" >> "$LOG"
    exit 1
  fi
else
  rm -f "$TMP"
  echo "$(date -Is) FAIL pg_dump exited non-zero" >> "$LOG"
  exit 1
fi
# rotate: keep newest $KEEP
ls -1t "$BACKUP_DIR"/cafeqr-*.sql.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
