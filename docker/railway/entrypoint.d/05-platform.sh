#!/usr/bin/env bash
# Platform glue for Railway-style hosting, run before Moodle's init script:
# - Apache listens on $PORT (Railway injects it; defaults to 80).
# - /healthz answers 200 from Apache without going through Moodle, which
#   would redirect any host other than wwwroot.
(
  set -euo pipefail
  port="${PORT:-80}"
  sed -i "s/^Listen .*/Listen ${port}/" /etc/apache2/ports.conf
  sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${port}>/" /etc/apache2/sites-enabled/000-default.conf

  mkdir -p /var/www/health
  echo ok > /var/www/health/index.txt
  cat > /etc/apache2/conf-enabled/healthz.conf <<'CONF'
Alias /healthz /var/www/health/index.txt
<Directory /var/www/health>
    Require all granted
</Directory>
CONF
  echo "[platform] Apache on port ${port}, health check at /healthz"
)
