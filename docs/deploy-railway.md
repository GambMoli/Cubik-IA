# Despliegue en Railway

Moodle en Railway con dos servicios:

```
Internet ──HTTPS──► Railway (*.up.railway.app) ──► Moodle (Dockerfile: Apache + PHP 8.3 + cron)
                                                        │   └── volumen: /var/www/moodledata
                                                        └──► Postgres (base de datos de Railway, red privada)
```

- `Dockerfile` construye la imagen con el código de `moodle/`, `docker/moodle/config.php`
  y los scripts de arranque (instalación automática, puerto `$PORT`, `/healthz` y cron
  cada minuto dentro del mismo contenedor).
- `railway.json` indica a Railway que use ese `Dockerfile` y el health check `/healthz`.
- El entorno local (`docker-compose.yml`) no cambia.

> ⚠️ **Uso previsto: piloto o demo.** Railway no tiene plan gratuito suficiente para Moodle:
> el plan **Hobby** cuesta 5 USD al mes e incluye 5 USD de consumo. Con poco tráfico,
> Moodle y PostgreSQL usan aproximadamente 0,4–0,6 GB de RAM, es decir, unos **5–8 USD
> al mes** en total (RAM: 10 USD/GB·mes, CPU: 20 USD/vCPU·mes, volumen: 0,15 USD/GB·mes).
> Con la cuenta de prueba (*Trial*, 5 USD de crédito una sola vez, volumen máximo de 0,5 GB)
> sirve para probar unos días.

## 1. Crear el proyecto

1. Entra en <https://railway.com/new> e inicia sesión con GitHub.
2. Elige **Deploy from GitHub repo** → `GambMoli/Cubik-IA`.
   - Si no aparece, pulsa **Configure GitHub App** y da acceso al repositorio.
3. Railway crea el servicio y empieza un primer despliegue. **Ese primer intento
   fallará** porque aún faltan las variables; es normal.
4. En el servicio, abre **Settings → Source** y comprueba la rama:
   `main` (o la rama donde estén `Dockerfile` y `railway.json`, si aún no está fusionada).

## 2. Añadir PostgreSQL

1. En el lienzo del proyecto: **+ Create → Database → Add PostgreSQL**.
2. Déjale el nombre **`Postgres`**: las variables del paso 5 lo usan.

## 3. Volumen para `moodledata`

1. Clic derecho sobre el servicio de Moodle (o **⌘K / Ctrl+K → Volume**) →
   **Attach volume**.
2. **Mount path:** `/var/www/moodledata`

Sin este volumen, los archivos subidos y la caché se perderían en cada despliegue.

## 4. Dominio público

En el servicio de Moodle: **Settings → Networking → Generate Domain**.
Railway crea algo como `cubik-ia-production.up.railway.app`, con HTTPS incluido.
Si te pregunta el puerto, déjalo en el que detecta (Moodle escucha en `$PORT`).

## 5. Variables

En el servicio de Moodle: **Variables → Raw Editor**, pega esto y rellena las dos
líneas marcadas:

```env
MOODLE_DB_HOST=${{Postgres.PGHOST}}
MOODLE_DB_PORT=${{Postgres.PGPORT}}
MOODLE_DB_NAME=${{Postgres.PGDATABASE}}
MOODLE_DB_USER=${{Postgres.PGUSER}}
MOODLE_DB_PASSWORD=${{Postgres.PGPASSWORD}}
MOODLE_WWWROOT=https://${{RAILWAY_PUBLIC_DOMAIN}}
MOODLE_SSLPROXY=true
MOODLE_DEBUG=false
MOODLE_ADMIN_USER=admin
# Rellena: mínimo 8 caracteres con mayúscula, minúscula, número y símbolo
MOODLE_ADMIN_PASSWORD=
# Rellena:
MOODLE_ADMIN_EMAIL=
MOODLE_SITE_FULLNAME=Cubik IA
MOODLE_SITE_SHORTNAME=cubik
MOODLE_LANG=en
```

Pulsa **Update Variables** y después **Deploy** (o espera al redespliegue automático).

- Las variables `${{...}}` las resuelve Railway: la contraseña de la base de datos la
  genera Railway y nunca pasa por el repositorio.
- `MOODLE_WWWROOT` debe coincidir con el dominio del paso 4. Si más adelante añades un
  dominio propio, cambia esta variable a `https://tu-dominio`.

## 6. Primer arranque

1. Abre **Deployments → View logs**. Verás:
   - `[moodle-init] Empty database: installing Moodle...`
   - `[moodle-init] Moodle installation finished.`
   - `[cron] Moodle cron started`
2. La instalación tarda unos **3–6 minutos**. El health check espera hasta 15 minutos.
3. Abre `https://<tu-dominio>.up.railway.app` y entra con `admin` y la contraseña de
   `MOODLE_ADMIN_PASSWORD`. En la primera visita a *Administración del sitio* aparece
   **New settings**: revísala y pulsa **Save changes**.

Los siguientes despliegues detectan que Moodle ya está instalado y no lo reinstalan.

## Operación

| Tarea | Cómo |
|---|---|
| Ver registros | Servicio → **Deployments → View logs** |
| Reiniciar | Servicio → **⋮ → Restart** |
| Actualizar Moodle o la configuración | Haz push a la rama conectada; Railway redespliega solo |
| Comandos de Moodle (CLI) | Instala la [CLI de Railway](https://docs.railway.com/guides/cli) y ejecuta `railway ssh`, luego `runuser -u www-data -- php admin/cli/checks.php` |
| Copia de la base de datos | Servicio **Postgres → Backups** (planes de pago) o `pg_dump` con la *Connection URL* pública |
| Controlar el gasto | **Workspace → Usage** y **Usage limits** (puedes fijar un tope mensual) |

## Solución de problemas

| Problema | Solución |
|---|---|
| `Missing required environment variable` en los logs | Falta una variable del paso 5. |
| El health check falla tras 15 minutos | Revisa los logs: suele ser la conexión a la base de datos (el servicio debe llamarse `Postgres`). |
| Moodle redirige a otra URL o el CSS no carga | `MOODLE_WWWROOT` no coincide con el dominio público, o falta `MOODLE_SSLPROXY=true`. |
| Los archivos subidos desaparecen tras desplegar | Falta el volumen en `/var/www/moodledata` (paso 3). |
| La instalación falló a mitad | Borra y vuelve a crear el servicio `Postgres` (⚠️ se pierden los datos) y redespliega. |
