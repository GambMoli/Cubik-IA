# Despliegue en Oracle Cloud (Always Free)

Guía para publicar Moodle en una VM gratuita de Oracle Cloud usando el mismo
`docker-compose.yml` del proyecto más `docker-compose.prod.yml`, que añade
**Caddy** como proxy con **HTTPS automático** (Let's Encrypt).

```
Internet ──► :80/:443  Caddy (HTTPS) ──► moodle:80 (Apache + PHP 8.3) ──► db (PostgreSQL 16)
                                              └── cron
```

> ⚠️ **Uso previsto: piloto o demo.** La imagen `moodlehq/moodle-php-apache`
> está pensada para desarrollo. Para usuarios reales, revisa antes la
> seguridad, las copias de seguridad y el correo saliente (ver
> [Limitaciones](#limitaciones)).

## Qué incluye el nivel gratuito (comprobado en la documentación de Oracle)

- VM Arm `VM.Standard.A1.Flex`: **2 OCPU y 12 GB de RAM** en total.
- **200 GB** de almacenamiento en bloque (incluye el disco de arranque).
- Las instancias gratuitas deben crearse en tu **región de origen** (home
  region), que eliges al registrarte y **no se puede cambiar**.

Fuente: [Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

---

## Opción rápida: script automático

`scripts/oci/provision-moodle.sh` hace todo lo de los pasos 2 a 7 con un solo
comando: crea la red, abre los puertos, crea la VM gratuita, instala Docker y
arranca Moodle con HTTPS.

1. Entra en la consola de Oracle y abre **Cloud Shell**: el icono `>_` de
   arriba a la derecha (o **Developer tools → Cloud Shell**). Es una terminal
   que ya tiene acceso a tu cuenta, así que no hace falta crear claves de API.
2. Pega este comando y pulsa Enter:

   ```bash
   bash <(curl -fsSL https://raw.githubusercontent.com/GambMoli/Cubik-IA/main/scripts/oci/provision-moodle.sh)
   ```

3. Escribe el correo del administrador cuando te lo pida y espera entre 10 y
   15 minutos.

Al terminar, el script muestra la **URL**, el **usuario** y la **contraseña**
del administrador, y el comando SSH para entrar en la VM. Esos datos quedan
también guardados en `~/cubik-moodle/credentials.txt`, dentro de Cloud Shell.
La clave SSH queda en `~/.ssh/cubik-moodle`: descárgala desde el menú de Cloud
Shell (**⚙ → Download**) si quieres conectarte desde tu PC.

Puedes volver a ejecutarlo sin problema: reutiliza lo que ya existe (la red,
la VM y el `.env` del servidor).

Variables opcionales, que se ponen delante de `bash`: `OCPUS=2`,
`MEMORY_GB=12`, `BOOT_GB=50`, `BRANCH=main`, `ADMIN_EMAIL=...`.

Si prefieres hacerlo a mano desde la consola, sigue los pasos de abajo.

---

## 1. Crear la cuenta

1. Regístrate en <https://www.oracle.com/cloud/free/>.
2. Oracle pide una tarjeta para verificar tu identidad. Los recursos
   *Always Free* no se cobran.
3. Elige bien la **Home Region**, porque no se puede cambiar. Escoge una
   cercana a tus usuarios (por ejemplo, *Brazil East (São Paulo)*, *Chile
   Central (Santiago)*, *Mexico Central (Querétaro)* o *US East (Ashburn)*).

## 2. Crear la VM

En la consola: **☰ → Compute → Instances → Create instance**.

| Campo | Valor |
|---|---|
| Name | `cubik-moodle` |
| Image | **Canonical Ubuntu 24.04** (selecciona la variante *aarch64* si te lo pregunta) |
| Shape | **Change shape → Ampere → VM.Standard.A1.Flex**, **2 OCPU** y **12 GB** de memoria |
| Networking | *Create new virtual cloud network* + *Create new public subnet*, con **Assign a public IPv4 address** activado |
| SSH keys | **Generate a key pair for me → Save private key** (guarda el archivo `.key`, lo necesitarás) |
| Boot volume | El tamaño por defecto (~50 GB) es suficiente |

Pulsa **Create**. Cuando el estado sea *Running*, copia la **Public IP
address**.

> Si aparece **"Out of host capacity"**, significa que no quedan máquinas
> gratuitas en ese momento. Prueba con otro *Availability domain* en el mismo
> formulario o vuelve a intentarlo más tarde.

## 3. Abrir los puertos 80 y 443

Hay que abrirlos en **dos sitios**: en la red de Oracle y en el firewall de
Ubuntu.

### 3.1 Red de Oracle (Security List)

**☰ → Networking → Virtual cloud networks →** tu VCN **→ Security → Security
Lists → Default Security List → Add Ingress Rules**. Añade dos reglas:

| Source CIDR | IP Protocol | Destination Port Range |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

### 3.2 Conectarte por SSH

```bash
# Linux / macOS
chmod 600 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@TU_IP_PUBLICA
```

En Windows (PowerShell), si `ssh` se queja de los permisos de la clave:

```powershell
icacls .\ssh-key.key /inheritance:r /grant:r "$($env:USERNAME):R"
ssh -i .\ssh-key.key ubuntu@TU_IP_PUBLICA
```

### 3.3 Firewall de Ubuntu (dentro de la VM)

Las imágenes de Ubuntu de Oracle traen reglas `iptables` que bloquean todo
excepto SSH:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Instalar Docker

```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit        # sal y vuelve a conectarte por SSH para aplicar el grupo
```

Comprueba que funciona: `docker compose version`.

## 5. Descargar el proyecto

```bash
git clone https://github.com/GambMoli/Cubik-IA.git
cd Cubik-IA
```

Si el repositorio es **privado**, `git` te pedirá un usuario y una
contraseña. Usa tu usuario de GitHub y, como contraseña, un **token**:
GitHub → *Settings → Developer settings → Personal access tokens →
Fine-grained tokens*, con acceso de solo lectura (*Contents: Read*) a este
repositorio.

## 6. Configurar `.env`

```bash
cp .env.example .env
nano .env
```

Rellena o cambia:

| Variable | Valor |
|---|---|
| `COMPOSE_FILE` | Descomenta la línea `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` (quita el `#`) para que `docker compose` use siempre la configuración de servidor |
| `MOODLE_DOMAIN` | Tu dominio. **Sin dominio propio, usa sslip.io**: para la IP `129.146.10.20` pon `129-146-10-20.sslip.io` |
| `MOODLE_DB_PASSWORD` | Genérala con `openssl rand -base64 24` |
| `MOODLE_ADMIN_PASSWORD` | Contraseña fuerte (mayúscula, minúscula, número y símbolo) |
| `MOODLE_ADMIN_EMAIL` | Tu correo |
| `MOODLE_LANG` | `en` (después puedes añadir el español desde la administración) |

No hace falta tocar `MOODLE_WWWROOT`, `MOODLE_HTTP_PORT` ni `MOODLE_DEBUG`: en
modo servidor, `docker-compose.prod.yml` fija `https://MOODLE_DOMAIN` y
desactiva la depuración.

Comprueba la configuración:

```bash
docker compose config --quiet && echo OK
```

## 7. Arrancar

```bash
docker compose up -d
docker compose logs -f moodle      # espera a "Moodle installation finished" (Ctrl+C para salir)
docker compose ps                  # moodle debe aparecer como "healthy"
```

Abre **`https://TU_DOMINIO`** (por ejemplo, `https://129-146-10-20.sslip.io`).
El certificado se obtiene automáticamente la primera vez y puede tardar unos
segundos.

Entra con `MOODLE_ADMIN_USER` / `MOODLE_ADMIN_PASSWORD`. En la primera visita a
*Administración del sitio* aparece **New settings**: revísala y pulsa **Save
changes**.

Gracias a `restart: always`, los contenedores vuelven a arrancar solos si la
VM se reinicia.

## 8. Operación diaria

```bash
cd ~/Cubik-IA

docker compose ps                         # estado
docker compose logs --tail=100 moodle     # registros
docker compose restart moodle             # reiniciar Moodle
docker compose down && docker compose up -d   # recrear contenedores (conserva los datos)

# Actualizar el proyecto
git pull
docker compose up -d
docker compose exec -u www-data moodle php admin/cli/upgrade.php --non-interactive
```

### Copias de seguridad

```bash
mkdir -p ~/backups
# Base de datos
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > ~/backups/db-$(date +%F).sql.gz
# Archivos (moodledata)
docker run --rm -v cubik-ia_moodle_data:/data -v ~/backups:/backup alpine \
  tar czf /backup/moodledata-$(date +%F).tgz -C /data .
```

Para hacerlas cada día a las 3:00, ejecuta `crontab -e` y añade:

```
0 3 * * * cd /home/ubuntu/Cubik-IA && docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > /home/ubuntu/backups/db-$(date +\%F).sql.gz
```

Descarga las copias a tu PC de vez en cuando (`scp -i clave.key
ubuntu@IP:~/backups/* .`): si pierdes la VM, también pierdes las copias que
estén en ella.

## Solución de problemas

| Problema | Solución |
|---|---|
| El navegador no conecta (timeout) | Revisa los dos firewalls del paso 3 (Security List **y** `iptables`). |
| Error de certificado / Caddy no obtiene HTTPS | `docker compose logs caddy`. El dominio debe apuntar a la IP pública y los puertos 80 y 443 deben estar abiertos. Si sslip.io alcanza el límite de Let's Encrypt, usa un dominio gratuito de [DuckDNS](https://www.duckdns.org) o uno propio. |
| Moodle redirige a otra URL | `MOODLE_DOMAIN` debe coincidir exactamente con el dominio que escribes en el navegador. Después de cambiarlo, ejecuta `docker compose up -d`. |
| "Out of host capacity" al crear la VM | Prueba con otro *Availability domain* o espera unas horas. |
| La VM se detuvo sola | Ver *Instancias inactivas* más abajo. |

## Limitaciones

- **Instancias inactivas:** Oracle puede recuperar una VM gratuita si durante
  7 días su uso de CPU (percentil 95), de red **y** de memoria se mantiene por
  debajo del 20 %. Con poco tráfico, Moodle puede quedar por debajo de esos
  umbrales. Revisa la VM de vez en cuando.
- **Correo:** Oracle bloquea por defecto el puerto 25 de salida. Para que
  Moodle envíe correos (recuperar contraseñas, notificaciones), configura un
  servicio SMTP externo en *Administración del sitio → Servidor → Correo →
  Configuración del correo saliente* (puerto 587).
- **Imagen de desarrollo:** `moodlehq/moodle-php-apache` es la imagen de
  desarrollo de Moodle HQ. Sirve para un piloto; para producción, conviene una
  imagen propia endurecida.
- **Una sola VM:** no hay alta disponibilidad. Las copias de seguridad son
  responsabilidad tuya.
