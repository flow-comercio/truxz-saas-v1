#!/bin/bash
# =============================================================================
#  AUTO PRIME — Script de atualização em produção (sem Docker)
#  Uso: bash scripts/update.sh
# =============================================================================
set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
log()  { echo -e "${GREEN}[✔]${NC} $1"; }
info() { echo -e "${BLUE}[ℹ]${NC} $1"; }

APP_DIR="/var/www/truxz"
PM2_APP="truxz"

echo -e "${BOLD}🚗 TRUXZ — Atualização em Produção${NC}"
echo ""

cd $APP_DIR

# Backup antes de atualizar
info "Fazendo backup do banco..."
PGPASSWORD="Win7830@" pg_dump -h localhost -U truxz truxz_db \
  | gzip > "/var/backups/truxz/pre-update-$(date +%Y%m%d_%H%M%S).sql.gz"
log "Backup criado"

# Instalar dependências
info "Instalando dependências..."
npm ci --production=false
log "Dependências OK"

# Migrations
info "Executando migrations..."
npm run db:push
log "Migrations OK"

# Build
info "Compilando aplicação..."
npm run build
log "Build OK"

# Reiniciar
info "Reiniciando aplicação..."
pm2 restart $PM2_APP
log "PM2 reiniciado"

echo ""
echo -e "${GREEN}${BOLD}✅ Atualização concluída!${NC}"
echo "  Status: pm2 status"
echo "  Logs:   pm2 logs $PM2_APP"
