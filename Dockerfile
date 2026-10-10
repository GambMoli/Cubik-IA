# Moodle image for Railway (and any platform that builds from a Dockerfile).
# The local environment does not use this file: docker-compose.yml mounts the
# same pieces from the working tree instead.
FROM moodlehq/moodle-php-apache:8.3

COPY --chown=www-data:www-data moodle/ /var/www/html/
COPY --chown=www-data:www-data docker/moodle/config.php /var/www/html/config.php
COPY --chmod=755 docker/moodle/entrypoint.d/ /docker-entrypoint.d/
COPY --chmod=755 docker/railway/entrypoint.d/ /docker-entrypoint.d/
