#!/usr/bin/env bash
# Provisions Moodle on an Oracle Cloud "Always Free" VM, end to end.
#
# Run it in OCI Cloud Shell (Console > Developer tools > Cloud Shell), where the
# OCI CLI is already authenticated with your account:
#
#   bash <(curl -fsSL https://raw.githubusercontent.com/GambMoli/Cubik-IA/main/scripts/oci/provision-moodle.sh)
#
# It creates (or reuses, if they already exist):
#   - a VCN with an internet gateway and a public subnet,
#   - security list rules for SSH (22), HTTP (80) and HTTPS (443),
#   - an Ubuntu 24.04 VM.Standard.A1.Flex instance (2 OCPU / 12 GB by default),
# then installs Docker on the VM and starts Moodle with docker-compose.prod.yml
# behind HTTPS at https://<public-ip-with-dashes>.sslip.io
#
# Safe to run again: existing resources and the server's .env are reused.

set -euo pipefail

PREFIX="${PREFIX:-cubik}"
REPO_URL="${REPO_URL:-https://github.com/GambMoli/Cubik-IA.git}"
BRANCH="${BRANCH:-main}"
OCPUS="${OCPUS:-2}"
MEMORY_GB="${MEMORY_GB:-12}"
BOOT_GB="${BOOT_GB:-50}"
RETRY_MINUTES="${RETRY_MINUTES:-0}"
MAX_ROUNDS="${MAX_ROUNDS:-1}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/${PREFIX}-moodle}"
STATE_DIR="${STATE_DIR:-$HOME/${PREFIX}-moodle}"

VCN_NAME="${PREFIX}-vcn"
SUBNET_NAME="${PREFIX}-public-subnet"
IGW_NAME="${PREFIX}-igw"
INSTANCE_NAME="${PREFIX}-moodle"
SHAPE="VM.Standard.A1.Flex"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

# Prints a single value from an OCI CLI query, or nothing when there is none.
oci_value() {
  local out
  out="$("${OCI[@]}" "$@" --raw-output 2>/dev/null || true)"
  [ "${out}" = "null" ] && out=""
  printf '%s' "${out}"
}

command -v oci >/dev/null || die "OCI CLI not found. Run this script in OCI Cloud Shell."
command -v ssh-keygen >/dev/null || die "ssh-keygen not found."

# --- Account, home region and compartment ----------------------------------
log "Checking the account"

COMPARTMENT_ID="${COMPARTMENT_ID:-${OCI_TENANCY:-}}"
[ -n "${COMPARTMENT_ID}" ] || die "Could not detect the tenancy. Run: COMPARTMENT_ID=<tenancy OCID> bash provision-moodle.sh"

HOME_REGION="$(oci iam region-subscription list --tenancy-id "${COMPARTMENT_ID}" \
  --query 'data[?"is-home-region"] | [0]."region-name"' --raw-output 2>/dev/null || true)"
[ -n "${HOME_REGION}" ] && [ "${HOME_REGION}" != "null" ] || die "Could not read the home region."

# Always Free compute only exists in the home region, so every call targets it.
OCI=(oci --region "${HOME_REGION}")
info "Home region: ${HOME_REGION}"
info "Compartment: ${COMPARTMENT_ID}"

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
while [ -z "${ADMIN_EMAIL}" ]; do
  read -rp "    Email for the Moodle administrator: " ADMIN_EMAIL
done

# --- Network ------------------------------------------------------------------
log "Network"

VCN_ID="$(oci_value network vcn list --compartment-id "${COMPARTMENT_ID}" --display-name "${VCN_NAME}" \
  --lifecycle-state AVAILABLE --all --query 'data[0].id')"
if [ -z "${VCN_ID}" ]; then
  info "Creating VCN ${VCN_NAME}..."
  VCN_ID="$("${OCI[@]}" network vcn create --compartment-id "${COMPARTMENT_ID}" \
    --display-name "${VCN_NAME}" --cidr-blocks '["10.0.0.0/16"]' --dns-label "${PREFIX}vcn" \
    --wait-for-state AVAILABLE --query 'data.id' --raw-output)"
else
  info "Reusing VCN ${VCN_NAME}"
fi

IGW_ID="$(oci_value network internet-gateway list --compartment-id "${COMPARTMENT_ID}" --vcn-id "${VCN_ID}" \
  --lifecycle-state AVAILABLE --all --query 'data[0].id')"
if [ -z "${IGW_ID}" ]; then
  info "Creating internet gateway..."
  IGW_ID="$("${OCI[@]}" network internet-gateway create --compartment-id "${COMPARTMENT_ID}" \
    --vcn-id "${VCN_ID}" --display-name "${IGW_NAME}" --is-enabled true \
    --wait-for-state AVAILABLE --query 'data.id' --raw-output)"
else
  info "Reusing internet gateway"
fi

# Any existing public subnet in the VCN is reused (e.g. one made by the Console wizard).
SUBNET_ID="$(oci_value network subnet list --compartment-id "${COMPARTMENT_ID}" --vcn-id "${VCN_ID}" \
  --lifecycle-state AVAILABLE --all --query 'data[?"prohibit-public-ip-on-vnic"==`false`] | [0].id')"
if [ -z "${SUBNET_ID}" ]; then
  info "Creating public subnet ${SUBNET_NAME}..."
  DEFAULT_RT="$("${OCI[@]}" network vcn get --vcn-id "${VCN_ID}" --query 'data."default-route-table-id"' --raw-output)"
  DEFAULT_SL="$("${OCI[@]}" network vcn get --vcn-id "${VCN_ID}" --query 'data."default-security-list-id"' --raw-output)"
  SUBNET_ID="$("${OCI[@]}" network subnet create --compartment-id "${COMPARTMENT_ID}" --vcn-id "${VCN_ID}" \
    --display-name "${SUBNET_NAME}" --cidr-block 10.0.0.0/24 --dns-label public \
    --route-table-id "${DEFAULT_RT}" --security-list-ids "[\"${DEFAULT_SL}\"]" \
    --prohibit-public-ip-on-vnic false --wait-for-state AVAILABLE --query 'data.id' --raw-output)"
else
  info "Reusing public subnet"
fi

RT_ID="$("${OCI[@]}" network subnet get --subnet-id "${SUBNET_ID}" --query 'data."route-table-id"' --raw-output)"
SL_ID="$("${OCI[@]}" network subnet get --subnet-id "${SUBNET_ID}" --query 'data."security-list-ids"[0]' --raw-output)"

info "Routing 0.0.0.0/0 through the internet gateway..."
"${OCI[@]}" network route-table update --rt-id "${RT_ID}" --force \
  --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"${IGW_ID}\"}]" \
  --wait-for-state AVAILABLE >/dev/null

info "Opening ports 22, 80 and 443..."
INGRESS='[
  {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"description":"SSH","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},
  {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"description":"HTTP","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},
  {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"description":"HTTPS","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},
  {"source":"0.0.0.0/0","protocol":"17","isStateless":false,"description":"HTTP/3","udpOptions":{"destinationPortRange":{"min":443,"max":443}}},
  {"source":"0.0.0.0/0","protocol":"1","isStateless":false,"icmpOptions":{"type":3,"code":4}},
  {"source":"10.0.0.0/16","protocol":"1","isStateless":false,"icmpOptions":{"type":3}}
]'
EGRESS='[{"destination":"0.0.0.0/0","protocol":"all","isStateless":false}]'
"${OCI[@]}" network security-list update --security-list-id "${SL_ID}" --force \
  --ingress-security-rules "${INGRESS}" --egress-security-rules "${EGRESS}" \
  --wait-for-state AVAILABLE >/dev/null

# --- SSH key ------------------------------------------------------------------
log "SSH key"
mkdir -p "$(dirname "${SSH_KEY}")" "${STATE_DIR}"
if [ ! -f "${SSH_KEY}" ]; then
  ssh-keygen -t rsa -b 4096 -N '' -C "${INSTANCE_NAME}" -f "${SSH_KEY}" >/dev/null
  info "Created ${SSH_KEY}"
else
  info "Reusing ${SSH_KEY}"
fi

# --- Instance -----------------------------------------------------------------
log "Virtual machine"

INSTANCE_ID="$(oci_value compute instance list --compartment-id "${COMPARTMENT_ID}" \
  --display-name "${INSTANCE_NAME}" --all \
  --query 'data[?"lifecycle-state"==`RUNNING` || "lifecycle-state"==`PROVISIONING` || "lifecycle-state"==`STARTING`] | [0].id')"

if [ -z "${INSTANCE_ID}" ]; then
  IMAGE_ID="$(oci_value compute image list --compartment-id "${COMPARTMENT_ID}" \
    --operating-system "Canonical Ubuntu" --operating-system-version "24.04" --shape "${SHAPE}" \
    --sort-by TIMECREATED --sort-order DESC --all --query 'data[0].id')"
  [ -n "${IMAGE_ID}" ] || die "No Ubuntu 24.04 image found for ${SHAPE}."

  # First boot: open the OS firewall (Oracle's Ubuntu images only allow SSH) and install Docker.
  CLOUD_INIT="${STATE_DIR}/cloud-init.sh"
  cat > "${CLOUD_INIT}" <<'EOF'
#!/bin/bash
set -eux
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
if command -v netfilter-persistent >/dev/null; then netfilter-persistent save; fi
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
EOF

  mapfile -t ADS < <("${OCI[@]}" iam availability-domain list --compartment-id "${COMPARTMENT_ID}" \
    --query 'data[].name' --raw-output | tr -d '[]", ' | grep -v '^$')
  [ "${#ADS[@]}" -gt 0 ] || die "Could not list availability domains."

  # Free Ampere capacity comes and goes, so retry every RETRY_MINUTES (0 = no retry).
  for ROUND in $(seq 1 "${MAX_ROUNDS}"); do
    for AD in "${ADS[@]}"; do
      info "Creating ${INSTANCE_NAME} in ${AD} (${OCPUS} OCPU / ${MEMORY_GB} GB)..."
      if OUT="$("${OCI[@]}" compute instance launch --compartment-id "${COMPARTMENT_ID}" \
          --availability-domain "${AD}" --display-name "${INSTANCE_NAME}" \
          --shape "${SHAPE}" --shape-config "{\"ocpus\":${OCPUS},\"memoryInGBs\":${MEMORY_GB}}" \
          --image-id "${IMAGE_ID}" --boot-volume-size-in-gbs "${BOOT_GB}" \
          --subnet-id "${SUBNET_ID}" --assign-public-ip true \
          --ssh-authorized-keys-file "${SSH_KEY}.pub" --user-data-file "${CLOUD_INIT}" \
          --wait-for-state RUNNING --max-wait-seconds 900 \
          --query 'data.id' --raw-output 2>&1)"; then
        INSTANCE_ID="$(printf '%s\n' "${OUT}" | grep -E '^ocid1\.instance\.' | tail -1)"
        break 2
      fi
      if printf '%s' "${OUT}" | grep -qi 'capacity'; then
        info "Oracle: $(printf '%s' "${OUT}" | grep -o '"message": "[^"]*"' | head -1)"
        continue
      fi
      die "Could not create the instance:"$'\n'"${OUT}"
    done
    if [ "${RETRY_MINUTES}" -gt 0 ] && [ "${ROUND}" -lt "${MAX_ROUNDS}" ]; then
      info "No free capacity (attempt ${ROUND}/${MAX_ROUNDS}); retrying in ${RETRY_MINUTES} min. Ctrl+C to stop."
      sleep "$((RETRY_MINUTES * 60))"
    fi
  done
  [ -n "${INSTANCE_ID}" ] || die "No Always Free capacity right now in ${HOME_REGION}. Run again later, try OCPUS=1 MEMORY_GB=6, or set RETRY_MINUTES=5."
else
  info "Reusing instance ${INSTANCE_NAME}"
fi

PUBLIC_IP=""
for _ in $(seq 1 30); do
  PUBLIC_IP="$(oci_value compute instance list-vnics --instance-id "${INSTANCE_ID}" --query 'data[0]."public-ip"')"
  [ -n "${PUBLIC_IP}" ] && break
  sleep 10
done
[ -n "${PUBLIC_IP}" ] || die "The instance has no public IP address."
DOMAIN="${PUBLIC_IP//./-}.sslip.io"
info "Public IP: ${PUBLIC_IP}"

# --- Moodle -------------------------------------------------------------------
log "Waiting for SSH"
SSH=(ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "ubuntu@${PUBLIC_IP}")
for _ in $(seq 1 60); do
  "${SSH[@]}" true 2>/dev/null && break
  sleep 10
done
"${SSH[@]}" true || die "Could not connect over SSH to ${PUBLIC_IP}."

log "Installing Moodle on the server (first time: 5-10 minutes)"
"${SSH[@]}" "BRANCH='${BRANCH}' REPO_URL='${REPO_URL}' DOMAIN='${DOMAIN}' ADMIN_EMAIL='${ADMIN_EMAIL}' bash -s" <<'REMOTE'
set -euo pipefail
echo "    Waiting for first-boot setup (Docker)..."
sudo cloud-init status --wait >/dev/null || true
command -v docker >/dev/null || { echo "Docker is not installed; see /var/log/cloud-init-output.log" >&2; exit 1; }

cd "$HOME"
[ -d Cubik-IA ] || git clone --quiet --branch "${BRANCH}" "${REPO_URL}" Cubik-IA
cd Cubik-IA
[ -f docker-compose.prod.yml ] || { echo "Branch ${BRANCH} has no docker-compose.prod.yml" >&2; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  db_pass="$(openssl rand -hex 24)"
  admin_pass="Moodle-$(openssl rand -hex 6)-A1!"
  sed -i \
    -e "s|^MOODLE_DB_PASSWORD=.*|MOODLE_DB_PASSWORD=${db_pass}|" \
    -e "s|^MOODLE_ADMIN_PASSWORD=.*|MOODLE_ADMIN_PASSWORD=${admin_pass}|" \
    -e "s|^MOODLE_ADMIN_EMAIL=.*|MOODLE_ADMIN_EMAIL=${ADMIN_EMAIL}|" \
    -e "s|^MOODLE_DOMAIN=.*|MOODLE_DOMAIN=${DOMAIN}|" \
    -e "s|^# COMPOSE_FILE=|COMPOSE_FILE=|" \
    .env
  chmod 600 .env
fi

sudo docker compose up -d --wait --wait-timeout 1200
sudo docker compose ps
REMOTE

ADMIN_USER="$("${SSH[@]}" "grep '^MOODLE_ADMIN_USER=' ~/Cubik-IA/.env | cut -d= -f2-")"
ADMIN_PASS="$("${SSH[@]}" "grep '^MOODLE_ADMIN_PASSWORD=' ~/Cubik-IA/.env | cut -d= -f2-")"

CREDS="${STATE_DIR}/credentials.txt"
umask 077
cat > "${CREDS}" <<EOF
Moodle URL:     https://${DOMAIN}
Admin user:     ${ADMIN_USER}
Admin password: ${ADMIN_PASS}
SSH:            ssh -i ${SSH_KEY} ubuntu@${PUBLIC_IP}
EOF

log "Done"
cat "${CREDS}"
echo
info "These details are saved in ${CREDS} (Cloud Shell only)."
info "To connect from your own computer, download ${SSH_KEY} from Cloud Shell (menu > Download)."
info "The certificate is issued on the first visit; if the browser warns, wait a minute and reload."
