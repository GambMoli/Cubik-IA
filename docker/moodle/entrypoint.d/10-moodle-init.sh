#!/usr/bin/env bash
# Prepares moodledata and installs the Moodle database on first start.
#
# Run by the moodlehq/moodle-php-apache entrypoint (from /docker-entrypoint.d)
# before Apache starts. It is idempotent: if the database already contains a
# Moodle installation, it only fixes permissions and returns.
#
# Everything runs in a subshell so that this script behaves the same whether
# the image entrypoint executes it or sources it.

(
  set -euo pipefail

  MOODLE_DIR=/var/www/html
  MOODLE_DATA=/var/www/moodledata

  log() { echo "[moodle-init] $*"; }

  require_env() {
    local name
    for name in "$@"; do
      if [ -z "${!name:-}" ]; then
        log "ERROR: environment variable ${name} is empty. Define it in .env (see .env.example)."
        return 1
      fi
    done
  }

  require_env MOODLE_DB_NAME MOODLE_DB_USER MOODLE_DB_PASSWORD MOODLE_WWWROOT \
    MOODLE_ADMIN_USER MOODLE_ADMIN_PASSWORD MOODLE_ADMIN_EMAIL

  if [ ! -f "${MOODLE_DIR}/version.php" ]; then
    log "ERROR: ${MOODLE_DIR}/version.php not found. Is ./moodle mounted?"
    exit 1
  fi

  # moodledata must be writable by Apache (www-data).
  mkdir -p "${MOODLE_DATA}"
  find "${MOODLE_DATA}" \! -user www-data -exec chown www-data:www-data {} +
  chmod 2775 "${MOODLE_DATA}"

  # Prints "installed", "empty" or "unreachable".
  db_state() {
    php -r '
      $conn = @pg_connect(sprintf(
          "host=%s port=%s dbname=%s user=%s password=%s connect_timeout=5",
          getenv("MOODLE_DB_HOST") ?: "db", getenv("MOODLE_DB_PORT") ?: "5432",
          getenv("MOODLE_DB_NAME"), getenv("MOODLE_DB_USER"), getenv("MOODLE_DB_PASSWORD")));
      if (!$conn) { echo "unreachable"; exit; }
      $table = (getenv("MOODLE_DB_PREFIX") ?: "mdl_") . "config";
      $res = pg_query_params($conn, "SELECT to_regclass(\$1) IS NOT NULL", [$table]);
      echo pg_fetch_result($res, 0, 0) === "t" ? "installed" : "empty";
    '
  }

  state=unreachable
  for _ in $(seq 1 30); do
    state="$(db_state)"
    [ "${state}" != unreachable ] && break
    log "Waiting for the database..."
    sleep 2
  done

  case "${state}" in
    unreachable)
      log "ERROR: could not connect to the database at ${MOODLE_DB_HOST:-db}:${MOODLE_DB_PORT:-5432}."
      exit 1
      ;;
    installed)
      log "Moodle is already installed; skipping installation."
      ;;
    empty)
      log "Empty database: installing Moodle (this takes a few minutes)..."
      runuser -u www-data -- php "${MOODLE_DIR}/admin/cli/install_database.php" \
        --agree-license \
        --lang="${MOODLE_LANG:-en}" \
        --fullname="${MOODLE_SITE_FULLNAME:-Cubik IA}" \
        --shortname="${MOODLE_SITE_SHORTNAME:-cubik}" \
        --adminuser="${MOODLE_ADMIN_USER}" \
        --adminpass="${MOODLE_ADMIN_PASSWORD}" \
        --adminemail="${MOODLE_ADMIN_EMAIL}" \
        --supportemail="${MOODLE_ADMIN_EMAIL}"
      log "Moodle installation finished."
      ;;
  esac
)
