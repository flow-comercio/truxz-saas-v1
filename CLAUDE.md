# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Next.js dev server (porta padrão 3000)

# Build e deploy (produção na VPS)
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 restart truxz --update-env

# Database
npm run db:push      # Aplica schema sem migration (dev/staging)
npm run db:migrate   # Executa migrations
npm run db:generate  # Gera arquivos de migration a partir do schema
npm run db:studio    # Abre Drizzle Studio na porta 4983

# Conexão direta ao banco
psql "postgresql://truxz:Win7830%40@localhost:5432/truxz_db"

# Logs de produção
pm2 logs truxz --lines 50
```

Não há testes automatizados no projeto.

## Arquitetura

### Multi-tenancy via subdomínio
Cada loja tem um `slug` único e é acessada via subdomínio (`slug.truxz.com.br`). O middleware em `src/middleware.ts` intercepta todas as requisições, extrai o slug do host e reescreve internamente `slug.truxz.com.br/rota` → `truxz.com.br/[slug]/rota` sem alterar a URL visível.

Funções de resolução:
- `src/lib/tenant.ts` → `getTenantBySlug(slug)` / `getCurrentTenant()` para Server Components
- O matcher do middleware exclui `_next/static`, `_next/image`, `*.png`, `*.json`, `icons/`, `manifest.json` para evitar interceptar assets

### 4 PWAs (Route Groups)
```
src/app/
├── (admin-loja)/admin/   → roles: admin_loja, master
├── (master)/master/      → role: master
├── (operacional)/        → roles: operador, admin_loja, master
├── (cliente)/cliente/    → role: cliente
└── [slug]/               → página pública da loja (sem auth)
```

Cada layout verifica `getServerSession` no servidor e redireciona para `/login` se não autorizado — a dupla checagem (middleware + layout) é intencional.

### Auth
NextAuth.js com provider `Credentials` (email + bcrypt). O JWT carrega `id`, `role` e `lojaId`. Em Server Components use `getServerSession(authOptions)`. O `lojaId` é `null` apenas para `master`. Login lança `throw new Error('EmailNaoVerificado')` para bloquear contas não verificadas.

### Global Providers
`src/components/providers.tsx` envolve toda a aplicação com `SessionProvider` + `QueryClientProvider` (`@tanstack/react-query`, staleTime 60 s, retry 1).

### Banco de dados
Drizzle ORM com PostgreSQL. Schema dividido em:
- `src/db/schema/core.ts` — planos, lojas, usuários, serviços, agendamentos, pagamentos, tokens, usoMensal
- `src/db/schema/erp.ts` — produtos, estoque, movimentações, orçamentos, OS, vendas
- `src/db/schema/equipe.ts` — permissões por operador, config comissões, metas, XP, eventos XP, conquistas
- `src/db/schema/crm.ts` — leads, interações de lead, push subscriptions
- `src/db/schema/index.ts` — re-exporta tudo

Importe sempre com `import { db } from '@/db'`. Todo dado de loja **deve** ser filtrado por `lojaId`.

**Enums relevantes do schema core:**
- `roleEnum`: `master | admin_loja | operador | cliente`
- `statusLojaEnum`: `ativa | inativa | suspensa | trial`
- `statusAgendamentoEnum`: `pendente | confirmado | em_andamento | concluido | cancelado | no_show`
- `statusOsEnum` (erp): `aberta | diagnostico | aguardando_aprovacao | aprovada | em_execucao | aguardando_peca | concluida | cancelada | entregue`

### Verificação de limites do plano
`src/lib/plano-check.ts` — `verificarLimiteAgendamento(lojaId)` e `verificarLimiteOperadores(lojaId)`. Retorna `{ permitido: boolean, motivo?: string }`. Trial sem plano usa limite padrão de 50 agendamentos/mês.

### Design System — iOS 18 Automotive

**`globals.css` e `tailwind.config.ts` definem:**
- Fundo: `#080612` (base) / `#0E0B1C` (surface) / `#141028` (elevated)
- Brand: `#9D4EDD` (roxo) / dark `#7B2FBE` / light `#C77DFF`
- Accent: `#FF375F` (pink) / `#3F8EFF` (blue) / `#00D4FF` (cyan)
- Fonte: Nunito 300-900

**Classes CSS utilitárias globais:**
- `.card` — glass card com glassmorphism + shimmer no topo
- `.btn-primary` — roxo gradient, 48px, glow
- `.btn-secondary` — ghost glass
- `.btn-danger` — vermelho ghost
- `.input` — dark 52px, `font-size: 16px` (previne zoom iOS), focus glow roxo
- `.label` — uppercase 10px
- `.badge-success/warning/danger/info/neutral/blue`
- `.nav-item` / `.nav-item.active`
- `.glass` / `.glass-strong` / `.mesh-bg` / `.text-gradient`
- `.safe-top` / `.safe-bottom` — safe areas iOS

**`body::before`** injeta mesh gradient ambient (orbs roxo/pink/blue fixos, z-index 0). Todo conteúdo precisa de `position: relative; z-index: 1`.

**Padrões mobile obrigatórios:** `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `min-height: 44px` em interativos.

### Navegação

**Admin:**
- Desktop: `src/components/admin/sidebar.tsx` — sidebar fixa 60px, 12 módulos
- Mobile: bottom tab bar com 5 ícones (Cockpit, Agenda, Ordens, PDV, Config)

**Master:** `src/components/admin/master-sidebar.tsx`

**Operacional:** bottom tab bar em `src/components/operacional/nav.tsx` (Fila, Check-in, Serviço)

**Cliente:** bottom tab bar em `src/components/cliente/nav.tsx` (Início, Agendar, Veículos, Histórico, Perfil)

### Componentes UI reutilizáveis (`src/components/ui/`)
- `gauge.tsx` — gauge circular SVG com gradiente e glow (props: `value`, `max`, `size`, `color`, `unit`, `sub`)
- `page-header.tsx` — header sticky com botão voltar e slot direito
- `swipe-card.tsx` — card com swipe via framer-motion (ações concluir/cancelar)
- `bottom-sheet.tsx` — modal bottom sheet com drag-to-dismiss
- `badge.tsx`, `button.tsx`, `input.tsx`, `glass-card.tsx`, `glow-bg.tsx`

### ERP — Fluxo de dados

**OS (Ordem de Serviço):** `aberta → diagnostico → aprovada → em_execucao → concluida → entregue`. Ao concluir (`PATCH /api/os/[id]` com `status: concluida`):
1. Calcula e insere comissão automática baseada em `configComissoes`
2. Chama `verificarEConcederConquistas()` (primeira_os, os_10, os_50, os_100, assinatura_coletada)
3. Envia push notification para cada conquista nova via `sendPushToUser`
4. Debita estoque dos itens com `estoqueDebitado: false`

**PDV (Vendas):** ao finalizar (`POST /api/vendas`), calcula comissão por item com `comissaoTipo` configurado:
- `percentual` → `total_item × (comissaoValor / 100)`
- `fixo` → `comissaoValor × quantidade`
- `null` → sem comissão

**Financeiro:** receita total = `pagamentos` (agendamentos) + `vendas` (PDV). Ambas as origens somadas nos KPIs de `/admin/financeiro` e `/api/relatorios`.

### Gamificação
XP: 500 XP por nível, acumulados em `xpOperador.totalHistorico`. `nivel = Math.floor(totalHistorico / 500) + 1`.

Dashboard operacional em `/operacional/dashboard` — "Meu Cofre" com comissões de OS e PDV, metas mensais, ranking da loja.

Conquistas disponíveis (seed em `scripts/seed-conquistas.ts`): `primeira_os`, `os_10`, `os_50`, `os_100`, `assinatura_coletada`.

### CRM
Pipeline de leads em `/admin/crm`. Estágios: `novo → contatado → proposta → negociando → ganho | perdido`. Origens: `app | instagram | indicacao | whatsapp | google | walk_in | outro`. Cada lead tem timeline de interações (`interacoesLead`). AI vendedor disponível via `/api/ai/vendedor`.

### IA (DeepSeek)
Cliente reutilizável em `src/lib/deepseek.ts`. Modelo `deepseek-chat`, chave `DEEPSEEK_API_KEY`.

| Endpoint | Usuário |
|---|---|
| `/api/ai/assistente` | admin_loja |
| `/api/ai/atendimento` | cliente |
| `/api/ai/atendimento-publico` | público (página [slug]) |
| `/api/ai/vendedor` | admin_loja (CRM) |
| `/api/ai/ocr-placa` | OCR via tesseract.js |

Rate limiting em-memória em `src/lib/rate-limit.ts` (`checkRateLimit(key, maxRequests, windowMs)`). Purge automático a cada 10 min. **Não persiste** entre reinicializações do PM2. `sanitizeHistorico` bloqueia injeção de `role: system` no histórico de chat.

### Push Notifications (PWA)
`src/lib/push.ts` — `sendPushToUser(usuarioId, payload)` e `sendPushToLoja(lojaId, payload)`. Subscriptions na tabela `pushSubscriptions`. Subscriptions com erro 410/404 são removidas automaticamente.

Componente `<PushRegister />` incluído nos layouts de admin e cliente.

### E-mail
cPanel — `mail.truxz.com.br:587` (STARTTLS). Fluxo: cadastro → `emailVerificado: false` → e-mail de confirmação → clique em `/api/auth/verificar-email` libera acesso.

### Pagamentos (Asaas)
`src/lib/asaas.ts`. `ASAAS_API_KEY` e `ASAAS_WEBHOOK_SECRET` estão **vazios** — pagamentos desativados. Webhook handler em `/api/webhooks/asaas`.

### Variáveis de ambiente (`.env`)
```
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, BASE_DOMAIN
ASAAS_API_KEY, ASAAS_WEBHOOK_SECRET, ASAAS_ENV
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
UPLOAD_DIR, MAX_FILE_SIZE
DEEPSEEK_API_KEY
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, NEXT_PUBLIC_VAPID_KEY
```

### Deploy
- VPS: `/var/www/truxz`
- PM2 cluster (2 instâncias) rodando `.next/standalone/server.js` na porta 3333
- Nginx → proxy reverso com SSL wildcard Let's Encrypt (`*.truxz.com.br`)
- Config PM2: `ecosystem.config.js`
- **Sempre** copiar `public/` e `.next/static/` para `standalone/` após build
