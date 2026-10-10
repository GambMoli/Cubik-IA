#!/usr/bin/env bash
# Runs Moodle's scheduled tasks every minute inside this container, for
# platforms where a separate cron service cannot share the moodledata volume.
(
  set -euo pipefail
  setsid nohup bash -c '
    while :; do
      runuser -u www-data -- php /var/www/html/admin/cli/cron.php --keep-alive=0 2>&1 \
        | grep -vE "^(Ran 0 adhoc|Cron run completed correctly|Cron completed at)" || true
      sleep 60
    done' >/proc/1/fd/1 2>&1 < /dev/null &
  echo "[cron] Moodle cron started (every 60 s)"
)
