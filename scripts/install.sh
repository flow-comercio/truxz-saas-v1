#!/bin/bash
# =============================================================================
#  AUTO PRIME SAAS — Script de Instalação para VPS Hostinger (Ubuntu 22.04)
#  Uso: bash install.sh truxz.com.br
# =============================================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'
log()     { echo -e "${GREEN}[✔]${NC} $1"; }
info()    { echo -e "${BLUE}[ℹ]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✘]${NC} $1"; exit 1; }
section() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}"; }

clear
echo -e "${BOLD}🚗 TRUXZ — Instalação${NC}"
echo ""

DOMAIN="${1:-truxz.com.br}"
APP_DIR="/var/www/truxz"
DB_NAME="truxz_db"
DB_USER="truxz"
DB_PASS="Win7830@"
APP_PORT="3333"
NODE_VERSION="20"
PM2_APP_NAME="truxz"
EMAIL_ADMIN="admin@${DOMAIN}"

info "Domínio:   $DOMAIN"
info "App dir:   $APP_DIR"
info "Banco:     $DB_NAME"
echo ""
read -p "Confirmar instalação? (s/N) " -n 1 -r
echo ""
[[ $REPLY =~ ^[Ss]$ ]] || exit 0

# ── 1. SISTEMA ────────────────────────────────────────────────────────────────
section "1/11 SISTEMA"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git unzip build-essential software-properties-common \
  apt-transport-https ca-certificates gnupg lsb-release ufw fail2ban
log "Sistema atualizado"

# ── 2. FIREWALL ───────────────────────────────────────────────────────────────
section "2/11 FIREWALL"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configurado"

# ── 3. NGINX ──────────────────────────────────────────────────────────────────
section "3/11 NGINX"
apt-get install -y nginx
systemctl enable nginx && systemctl start nginx
log "Nginx instalado"

# ── 4. NODE.JS ────────────────────────────────────────────────────────────────
section "4/11 NODE.JS $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
npm install -g pm2
log "Node.js $(node -v) + PM2 instalados"

# ── 5. POSTGRESQL ─────────────────────────────────────────────────────────────
section "5/11 POSTGRESQL"
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql && systemctl start postgresql
sudo -u postgres psql <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END\$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb -O $DB_USER $DB_NAME
sudo -u postgres psql <<SQL
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
log "PostgreSQL configurado"

# ── 6. DIRETÓRIOS ─────────────────────────────────────────────────────────────
section "6/11 DIRETÓRIOS"
mkdir -p $APP_DIR/{uploads/{logos,lojas},logs,.next}
mkdir -p /var/backups/truxz
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
log "Diretórios criados"

# ── 7. PROJETO ────────────────────────────────────────────────────────────────
section "7/11 PROJETO"
if [ -f "/tmp/truxz-saas-v2.zip" ]; then
  unzip -o /tmp/truxz-saas-v2.zip -d /tmp/
  cp -r /tmp/truxz-saas/. $APP_DIR/
  log "Projeto copiado do ZIP"
elif [ -d "/tmp/truxz-saas" ]; then
  cp -r /tmp/truxz-saas/. $APP_DIR/
  log "Projeto copiado da pasta"
else
  warn "Projeto não encontrado em /tmp/. Coloque o ZIP em /tmp/truxz-saas-v2.zip e execute novamente."
fi

# ── 8. AMBIENTE ───────────────────────────────────────────────────────────────
section "8/11 VARIÁVEIS DE AMBIENTE"
cat > $APP_DIR/.env <<ENV
DATABASE_URL="postgresql://${DB_USER}:$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DB_PASS}', safe=''))")@localhost:5432/${DB_NAME}"
NEXTAUTH_SECRET="truxz-secret-Win7830@-$(date +%s)"
NEXTAUTH_URL="https://${DOMAIN}"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
BASE_DOMAIN="${DOMAIN}"
NODE_ENV="production"
ASAAS_API_KEY=""
ASAAS_WEBHOOK_SECRET=""
ASAAS_ENV="production"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
UPLOAD_DIR="${APP_DIR}/uploads"
MAX_FILE_SIZE="5242880"
ENV
chmod 600 $APP_DIR/.env
log ".env criado"

# ── 9. BUILD ──────────────────────────────────────────────────────────────────
section "9/11 BUILD"
cd $APP_DIR
npm install --production=false --legacy-peer-deps
npx drizzle-kit push --force 2>/dev/null && log "Migrations OK" || warn "Migrations falharam — execute: npx drizzle-kit push --force"
export $(grep -v '^#' $APP_DIR/.env | xargs) && npx tsx scripts/seed.ts 2>/dev/null && log "Seed OK" || warn "Seed falhou — execute: npx tsx scripts/seed.ts"
npm run build
log "Build concluído"

cat > $APP_DIR/ecosystem.config.js <<'PM2'
module.exports = {
  apps: [{
    name: 'truxz',
    script: 'node_modules/.bin/next',
    args: 'start -p 3333',
    cwd: '/var/www/truxz',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3333 },
    max_memory_restart: '512M',
    error_file: '/var/www/truxz/logs/pm2-error.log',
    out_file:   '/var/www/truxz/logs/pm2-out.log',
    autorestart: true,
    watch: false,
  }]
}
PM2

pm2 start $APP_DIR/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true
log "PM2 iniciado"

# ── 10. NGINX + SSL WILDCARD ──────────────────────────────────────────────────
section "10/11 NGINX + SSL WILDCARD"
apt-get install -y certbot python3-certbot-nginx

# Nginx temporário (HTTP) para validação
cat > /etc/nginx/sites-available/truxz <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN} *.${DOMAIN};
    location / { proxy_pass http://127.0.0.1:${APP_PORT}; proxy_set_header Host \$host; }
}
NGINX
ln -sf /etc/nginx/sites-available/truxz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL wildcard via DNS challenge (Certbot)
echo ""
warn "Para SSL com subdomínios, é necessário certificado WILDCARD."
warn "Execute o comando abaixo e siga as instruções para adicionar o registro DNS TXT:"
echo ""
echo -e "  ${BOLD}certbot certonly --manual --preferred-challenges dns \\"
echo -e "    -d ${DOMAIN} -d *.${DOMAIN} \\"
echo -e "    --agree-tos -m ${EMAIL_ADMIN}${NC}"
echo ""
read -p "Deseja executar agora? (s/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  certbot certonly --manual --preferred-challenges dns \
    -d $DOMAIN -d "*.$DOMAIN" \
    --agree-tos -m $EMAIL_ADMIN && log "SSL Wildcard obtido!" || warn "SSL falhou — configure manualmente depois"
fi

# Nginx final com SSL
cp $APP_DIR/nginx/truxz.conf /etc/nginx/sites-available/truxz
sed -i "s/truxz.com.br/${DOMAIN}/g" /etc/nginx/sites-available/truxz
nginx -t && systemctl reload nginx && log "Nginx com SSL configurado"

# Renovação automática
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -

# ── 11. BACKUP AUTOMÁTICO ─────────────────────────────────────────────────────
section "11/11 BACKUP AUTOMÁTICO"
cat > /usr/local/bin/truxz-backup <<'BKPEOF'
#!/bin/bash
BKPDIR="/var/backups/truxz"
FILENAME="$BKPDIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD="Win7830@" pg_dump -h localhost -U truxz truxz_db | gzip > "$FILENAME"
echo "[BACKUP] $FILENAME - $(du -sh $FILENAME | cut -f1)"
ls -t $BKPDIR/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f
BKPEOF
chmod +x /usr/local/bin/truxz-backup
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/truxz-backup >> /var/log/truxz-backup.log 2>&1") | crontab -
log "Backup diário às 2h configurado"

# ── RESUMO ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         AUTO PRIME SAAS — INSTALAÇÃO CONCLUÍDA!          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${BOLD}🌐 URLs:${NC}"
echo "   Landing:   https://${DOMAIN}"
echo "   Cadastro:  https://${DOMAIN}/cadastrar"
echo "   Master:    https://${DOMAIN}/master/dashboard"
echo "   Demo loja: https://truxz-demo.${DOMAIN}"
echo ""
echo -e "${BOLD}🔐 Credenciais Master:${NC}"
echo "   Email: master@truxz.com.br"
echo "   Senha: Win7830@"
echo ""
echo -e "${BOLD}📋 DNS necessário (Hostinger):${NC}"
echo "   Tipo A:    ${DOMAIN}         → IP_DA_VPS"
echo "   Tipo A:    www.${DOMAIN}     → IP_DA_VPS"
echo "   Tipo A:    *.${DOMAIN}       → IP_DA_VPS  ← wildcard para lojas"
echo ""
echo -e "${BOLD}🛠️  Comandos úteis:${NC}"
echo "   pm2 status                    # status da app"
echo "   pm2 logs truxz           # logs em tempo real"
echo "   truxz-backup              # backup manual"
echo "   cd /var/www/truxz && bash scripts/update.sh  # atualizar"
echo ""
