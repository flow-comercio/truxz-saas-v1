# 🚗 TRUXZ v3.0

Sistema multi-tenant SaaS para estéticas automotivas.  
**Stack:** Next.js 14 · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS · NextAuth

---

## 📱 Painéis

| Painel         | URL                          | Usuário          |
|----------------|------------------------------|------------------|
| **Cliente**    | `/cliente`                   | cliente@demo.com |
| **Operacional**| `/operacional/fila`          | operador@demo.com|
| **Admin Loja** | `/admin/dashboard`           | admin@demo.com   |
| **Master**     | `/master/dashboard`          | master@truxz.com.br |

**Senha padrão de todos:** `Win7830@`

---

## 🚀 Instalação em VPS Hostinger

```bash
# 1. Envie o projeto para a VPS
scp -r ./truxz-saas root@IP_DA_VPS:/tmp/truxz-saas

# 2. Acesse a VPS
ssh root@IP_DA_VPS

# 3. Execute o instalador
bash /tmp/truxz-saas/scripts/install.sh seudominio.com.br
```

O script instala e configura automaticamente:
- Node.js 20 + PM2 (cluster mode)
- PostgreSQL 14
- Nginx + SSL (Let's Encrypt)
- Firewall (UFW) + Fail2Ban
- Banco de dados + seed inicial

---

## 💻 Desenvolvimento Local

```bash
# Pré-requisitos: Node.js 20+, PostgreSQL rodando

# 1. Instalar dependências
npm install

# 2. Copiar .env e configurar
cp .env.example .env
# Edite DATABASE_URL com seu PostgreSQL local

# 3. Criar tabelas
npm run db:push

# 4. Popular banco
npx tsx scripts/seed.ts

# 5. Iniciar dev server
npm run dev
# → http://localhost:3000
```

---

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── (admin-loja)/admin/   # Painel do dono da loja
│   ├── (operacional)/        # Painel dos funcionários
│   ├── (cliente)/cliente/    # App do cliente final
│   ├── (master)/master/      # Painel do dono da plataforma
│   ├── api/                  # REST API Routes
│   └── login/                # Autenticação
├── components/               # Componentes compartilhados
├── db/
│   └── schema/index.ts       # Schema do banco (Drizzle ORM)
├── lib/
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Helpers
└── middleware.ts              # Proteção de rotas por role
```

---

## 🗄️ Banco de Dados

Tabelas principais:
- `planos` — planos do SaaS (básico, profissional, premium)
- `lojas` — estéticas cadastradas (multi-tenant)
- `usuarios` — clientes, operadores, admins, master
- `servicos` — catálogo de serviços de cada loja
- `agendamentos` — agenda de atendimentos
- `pagamentos` — transações financeiras
- `assinaturas` — assinaturas das lojas no SaaS
- `veiculos` — veículos dos clientes
- `operadores` — funcionários das lojas

---

## 🔑 Roles de Usuário

| Role         | Acesso                                  |
|--------------|-----------------------------------------|
| `master`     | Tudo — gerencia toda a plataforma       |
| `admin_loja` | Dashboard, serviços, equipe, financeiro |
| `operador`   | Fila, check-in, serviço em andamento    |
| `cliente`    | Agendamento, histórico, perfil          |

---

## 🌐 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://truxz:Win7830@@localhost:5432/truxz_db"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="https://seudominio.com.br"
NEXT_PUBLIC_APP_URL="https://seudominio.com.br"
NODE_ENV="production"

# Asaas (pagamentos — opcional)
ASAAS_API_KEY=""
ASAAS_WEBHOOK_SECRET=""
```

---

## 📦 Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção (porta 3333)
npm run db:push      # Aplicar schema no banco
npm run db:generate  # Gerar migrations
npm run db:studio    # Abrir Drizzle Studio (GUI)
npx tsx scripts/seed.ts  # Popular banco com dados iniciais
```

---

## 🔒 Segurança

- Senhas hasheadas com **bcrypt** (salt 10)
- Sessões JWT via **NextAuth**
- Isolamento multi-tenant por `lojaId` em todas as queries
- Headers de segurança via Nginx
- Rotas protegidas por **middleware** com verificação de role
- Fail2Ban contra brute-force
- PostgreSQL acessível apenas localmente

---

**TRUXZ** · Desenvolvido para gestão de estéticas automotivas

---

## 🌐 Subdomínios dinâmicos

Cada loja tem sua própria URL pública automática:

```
seudominio.com.br              → Landing page / marketing
seudominio.com.br/cadastrar    → Cadastro de novas lojas (self-service)
nomealoja.seudominio.com.br    → Página pública da loja (catálogo + agendamento)
nomealoja.seudominio.com.br/login  → Login dos usuários da loja
```

### DNS necessário na Hostinger

| Tipo | Nome | Valor |
|------|------|-------|
| A | `seudominio.com.br` | IP da VPS |
| A | `www` | IP da VPS |
| A | `*` | IP da VPS ← **wildcard para todas as lojas** |

### SSL Wildcard

O install.sh guia você na geração do certificado wildcard via Certbot DNS challenge.
Cobre `seudominio.com.br` e todos os `*.seudominio.com.br` com um único certificado.

## 🛍️ Fluxo self-service completo

```
1. Cliente acessa seudominio.com.br
2. Clica em "Criar minha loja grátis"
3. Preenche wizard (plano → loja → admin → confirmar)
4. Sistema cria a loja + envia email com credenciais
5. Cliente acessa nomealoja.seudominio.com.br/login
6. Personaliza: logo, cor, WhatsApp, endereço, horários
7. Cadastra serviços e começa a receber agendamentos
```
