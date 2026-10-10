# Cubik IA — Monorepo

> ⚠️ **Solo para desarrollo local.** Esta configuración no está preparada para
> producción: usa HTTP sin TLS, un servidor web de desarrollo, credenciales
> definidas en un archivo `.env` local y opciones de depuración. No la expongas
> a Internet.

Monorepo con tres componentes independientes. En esta primera fase solo
**Moodle** es funcional; `backend/` y `frontend/` están reservados para el
desarrollo futuro.

## Estructura

```
Cubik-IA/
├── moodle/                    # Código fuente oficial de Moodle 4.5.15 (sin modificar)
├── backend/                   # Vacío (reservado)
├── frontend/                  # Vacío (reservado)
├── docker/
│   └── moodle/
│       ├── config.php         # config.php de Moodle; lee todo de variables de entorno
│       └── entrypoint.d/
│           └── 10-moodle-init.sh  # Permisos de moodledata + instalación automática
├── docker-compose.yml         # Infraestructura local (db, moodle, cron)
├── .env.example               # Variables de entorno de ejemplo (sin secretos)
├── .gitattributes
├── .gitignore
└── README.md
```

### Separación de responsabilidades

- **Moodle** funciona de forma autónoma. Su configuración vive en
  `docker/moodle/` y en `.env`, y sus datos en volúmenes de Docker, de modo
  que `moodle/` contiene únicamente el código oficial.
- **Backend (futuro)**: se comunicará con Moodle a través de sus
  [servicios web](https://docs.moodle.org/405/en/Web_services) (REST), no
  accediendo directamente a la base de datos.
- **Frontend (futuro)**: consumirá el backend y, cuando corresponda, se
  integrará con Moodle mediante mecanismos estándar (enlaces, SSO, LTI…).
- No hay autenticación compartida, APIs propias, plugins ni temas
  personalizados en esta fase.

## Versión y tecnologías

| Componente | Versión | Notas |
|---|---|---|
| Moodle | **4.5.15 (Build: 20261005)**, rama `405` (LTS), `MATURITY_STABLE` | Paquete oficial `moodle-4.5.15.tgz`, SHA256 `f0e09f636c2900806bf208dffdc462f3b6b0ad24163559e9aa9b4f339ddc2096` (coincide con el publicado en download.moodle.org) |
| PHP + Apache | PHP 8.3 (imagen `moodlehq/moodle-php-apache:8.3`) | Moodle 4.5 requiere PHP ≥ 8.1; 8.3 es una versión admitida. Imagen oficial de Moodle HQ con todas las extensiones necesarias |
| Base de datos | PostgreSQL 16 (`postgres:16-alpine`) | Moodle 4.5 requiere PostgreSQL ≥ 13 (`admin/environment.xml`) |
| Cron | Misma imagen PHP, ejecuta `admin/cli/cron.php` cada minuto | Moodle necesita sus tareas programadas |

Servicios de `docker-compose.yml`:

- `db`: PostgreSQL. No publica puertos en el host; solo es accesible desde la red interna de Docker.
- `moodle`: Apache + PHP. Publica `127.0.0.1:${MOODLE_HTTP_PORT}` (por defecto `8085`).
- `cron`: tareas programadas de Moodle.

## Requisitos previos

- Docker Engine 24+ o Docker Desktop (Windows/macOS) con **Docker Compose v2** (`docker compose`).
- Git.
- ~2 GB de espacio libre y el puerto `8085` libre (o cualquier otro que configures).

## Configuración (`.env`)

1. Copia la plantilla:

   ```bash
   cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
   ```

2. Rellena los valores vacíos en `.env`:

   | Variable | Descripción |
   |---|---|
   | `MOODLE_DB_PASSWORD` | Contraseña de PostgreSQL. Genera una con `openssl rand -base64 24` |
   | `MOODLE_ADMIN_PASSWORD` | Contraseña inicial del administrador de Moodle. Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo |
   | `MOODLE_ADMIN_EMAIL` | Correo del administrador |

3. Opcional: cambia `MOODLE_HTTP_PORT` si `8085` está ocupado. **Si cambias el
   puerto, actualiza también `MOODLE_WWWROOT`** (por ejemplo,
   `http://localhost:9090`). Moodle redirige siempre a `MOODLE_WWWROOT`.

`.env` está en `.gitignore`: **nunca lo subas al repositorio**. Si falta
alguna variable obligatoria, `docker compose` se detiene con un mensaje que
indica cuál es.

Las variables `MOODLE_ADMIN_*`, `MOODLE_SITE_*` y `MOODLE_LANG` solo se usan en
la **primera instalación**. Cambiarlas después no modifica el sitio: para eso,
usa la administración de Moodle.

## Uso

```bash
# Iniciar (la primera vez descarga imágenes e instala Moodle: 2–5 minutos)
docker compose up -d

# Ver el progreso de la instalación / registros
docker compose logs -f moodle

# Estado de los servicios (moodle debe aparecer como "healthy")
docker compose ps

# Detener (conserva los datos)
docker compose stop          # detiene los contenedores
docker compose down          # elimina los contenedores y la red; los volúmenes se conservan

# Reiniciar sin perder datos
docker compose restart                 # todos los servicios
docker compose restart moodle          # solo Moodle
docker compose down && docker compose up -d   # recrear contenedores
```

**URL local:** <http://localhost:8085> (o el valor de `MOODLE_WWWROOT`).

**Acceso inicial:** usuario `MOODLE_ADMIN_USER` (por defecto `admin`) y la
contraseña que definiste en `MOODLE_ADMIN_PASSWORD`.

> La primera vez que entres en *Administración del sitio*, Moodle muestra la
> página **"New settings"** con algunos ajustes iniciales. Revísalos y pulsa
> **Save changes**. Es el comportamiento normal tras una instalación por CLI.

### Primer arranque: qué ocurre

1. `db` arranca y espera a estar sano (`pg_isready`).
2. `moodle` ejecuta `docker/moodle/entrypoint.d/10-moodle-init.sh`, que:
   - asegura que `moodledata` pertenezca a `www-data`;
   - comprueba si la base de datos ya contiene Moodle (tabla `mdl_config`);
   - si está vacía, ejecuta `admin/cli/install_database.php` con los valores de `.env`;
   - si ya está instalado, no hace nada.
3. Arranca Apache. Cuando `/login/index.php` responde con 200, el servicio
   pasa a *healthy* y entonces se inicia `cron`.

## Datos persistentes

| Dato | Ubicación |
|---|---|
| Base de datos | Volumen Docker `cubik-ia_db_data` → `/var/lib/postgresql/data` |
| Archivos de Moodle (`moodledata`: subidas, caché, sesiones) | Volumen Docker `cubik-ia_moodle_data` → `/var/www/moodledata` |
| Configuración | `.env` (local) + `docker/moodle/config.php` (versionado, sin secretos) |
| Código | `moodle/` (versionado) |

```bash
docker volume ls | grep cubik-ia
docker volume inspect cubik-ia_db_data
```

Los volúmenes **solo se borran** con `docker compose down -v` o con
`docker volume rm`. Úsalos únicamente si quieres empezar de cero.

### Copia de seguridad rápida

```bash
# Base de datos
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > moodle-db.sql
# moodledata
docker run --rm -v cubik-ia_moodle_data:/data -v "$PWD":/backup alpine tar czf /backup/moodledata.tgz -C /data .
```

## Consultar la versión instalada

```bash
# Versión del código
grep '^\$release' moodle/version.php

# Versión registrada en la base de datos (la que realmente está instalada)
docker compose exec -u www-data moodle php admin/cli/cfg.php --name=release

# Comprobaciones de estado y del esquema
docker compose exec -u www-data moodle php admin/cli/checks.php
docker compose exec -u www-data moodle php admin/cli/check_database_schema.php
```

Desde el navegador: *Administración del sitio → Servidor → Entorno* o
*Administración del sitio → Notificaciones*.

## Comandos útiles

```bash
# Consola de PostgreSQL
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Purgar cachés de Moodle
docker compose exec -u www-data moodle php admin/cli/purge_caches.php

# Restablecer la contraseña de un usuario
docker compose exec -u www-data moodle php admin/cli/reset_password.php

# Ejecutar el cron manualmente
docker compose exec -u www-data moodle php admin/cli/cron.php
```

## Actualizar Moodle dentro de la rama 4.5

1. Descarga el paquete oficial `moodle-4.5.X.tgz` desde
   <https://download.moodle.org/releases/supported/> y verifica su SHA256.
2. Sustituye el contenido de `moodle/` por el del paquete. La configuración
   está en `docker/moodle/config.php`, así que no se pierde nada (el
   `moodle/config.php` vacío que crea Docker como punto de montaje está
   ignorado por Git).
3. Ejecuta `docker compose exec -u www-data moodle php admin/cli/upgrade.php --non-interactive`.
4. Haz commit del cambio en `moodle/`.

No actualices a Moodle 5.x sin revisar antes sus requisitos: cambia la
estructura de directorios y las versiones de PHP admitidas.

## Solución de problemas

| Problema | Solución |
|---|---|
| `required variable MOODLE_... is missing a value` | Falta un valor en `.env`. Revisa la sección [Configuración](#configuración-env). |
| `port is already allocated` | Cambia `MOODLE_HTTP_PORT` **y** `MOODLE_WWWROOT` en `.env` y ejecuta `docker compose up -d`. |
| El navegador redirige a otra URL o el CSS no carga | `MOODLE_WWWROOT` no coincide con la URL que estás usando. Usa exactamente la misma (por ejemplo, `localhost`, no `127.0.0.1`). |
| `moodle` sigue en `starting` | En el primer arranque, la instalación tarda unos minutos. Sigue el progreso con `docker compose logs -f moodle`. |
| La instalación falló a mitad | Mira el error en `docker compose logs moodle`, corrígelo y empieza de cero con `docker compose down -v && docker compose up -d` (⚠️ borra los datos). |
| `password authentication failed` después de cambiar `MOODLE_DB_PASSWORD` | PostgreSQL solo usa esa contraseña al crear el volumen. Restaura la anterior o recrea el volumen (`down -v`). |
| `Invalid login` con el administrador | Comprueba que usas la contraseña de la primera instalación. Para restablecerla, usa `admin/cli/reset_password.php`. |
| `429 Too Many Requests` al descargar imágenes | Límite de Docker Hub. Ejecuta `docker login` o espera unos minutos. |
| Scripts con `\r` / `bad interpreter` (Windows) | `.gitattributes` fuerza LF en `docker/**`. Si clonaste el repositorio antes de que existiera ese archivo, vuelve a clonarlo. |
| Rendimiento lento en Windows/macOS | Clona el repo dentro del sistema de archivos de WSL2 (Windows) o activa VirtioFS en Docker Desktop (macOS). |

## Seguridad y alcance

- Solo para desarrollo local: Moodle escucha en `127.0.0.1`, sin HTTPS.
- No hay secretos versionados: `.env.example` deja vacías las contraseñas.
- La instalación de plugins desde la web está desactivada
  (`disableupdateautodeploy`): el código se gestiona con Git.
- `MOODLE_DEBUG=true` muestra errores en el navegador; no lo actives fuera de desarrollo.
