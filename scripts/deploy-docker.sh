#!/bin/bash
# =============================================================================
#  AUTO PRIME — Deploy via Docker Compose (alternativa ao install.sh)
#  Uso: bash scripts/deploy-docker.sh [dominio]
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
log()  { echo -e "${GREEN}[✔]${NC} $1"; }
info() { echo -e "${BLUE}[ℹ]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

DOMAIN="${1:-truxz.com.br}"

echo -e "${BOLD}🚗 TRUXZ — Deploy Docker${NC}"
echo ""

# ── 1. Instalar Docker ────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  log "Docker instalado"
else
  log "Docker já instalado: $(docker --version)"
fi

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  info "Instalando Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  log "Docker Compose instalado"
fi

# ── 2. Criar .env se não existir ─────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|https://truxz.com.br|https://${DOMAIN}|g" .env
  warn ".env criado — edite com suas credenciais antes de continuar!"
  warn "  nano .env"
  read -p "Pressione Enter após editar o .env..."
fi

# ── 3. Build e subir containers ───────────────────────────────────────────────
info "Fazendo build da imagem..."
docker compose build --no-cache

info "Subindo containers..."
docker compose up -d

# ── 4. Aguardar DB ficar pronto ───────────────────────────────────────────────
info "Aguardando banco de dados..."
sleep 5
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U autoprime -d autoprime_db &>/dev/null; then
    log "Banco pronto!"
    break
  fi
  echo -n "."
  sleep 2
done

# ── 5. Migrations e Seed ──────────────────────────────────────────────────────
info "Executando migrations..."
docker compose exec -T app npm run db:push 2>/dev/null && log "Migrations OK" || warn "Migration falhou — execute: docker compose exec app npm run db:push"

info "Populando banco..."
docker compose exec -T app npx tsx scripts/seed.ts 2>/dev/null && log "Seed OK" || warn "Seed falhou — execute: docker compose exec app npx tsx scripts/seed.ts"

# ── 6. Nginx + SSL ────────────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx certbot python3-certbot-nginx 2>/dev/null
fi

cat > /etc/nginx/sites-available/truxz << NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN} *.${DOMAIN};
    location / { proxy_pass http://127.0.0.1:3333; proxy_set_header Host \$host; }
}
NGINX

ln -sf /etc/nginx/sites-available/truxz /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos \
  --email "admin@${DOMAIN}" --redirect 2>/dev/null \
  && log "SSL OK" || warn "SSL falhou — execute: certbot --nginx -d ${DOMAIN}"

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✅ Deploy Docker concluído!${NC}"
echo ""
echo "  App:       https://${DOMAIN}"
echo "  Containers: docker compose ps"
echo "  Logs:       docker compose logs -f app"
echo "  Parar:      docker compose down"
echo "  Backup:     docker compose exec postgres pg_dump -U autoprime autoprime_db | gzip > backup.sql.gz"
