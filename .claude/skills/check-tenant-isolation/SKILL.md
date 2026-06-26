---
name: check-tenant-isolation
description: Audita automaticamente queries Drizzle ORM buscando ausência do filtro lojaId — o bug mais crítico possível em um SaaS multi-tenant
user-invocable: false
---

Sempre que criar ou editar arquivos em `src/app/api/` ou `src/app/(admin-loja)/` ou `src/db/`:

Verifique se TODAS as operações de banco que envolvem tabelas multi-tenant incluem filtro por `lojaId`:

**Tabelas que EXIGEM filtro lojaId:**
- `agendamentos` → `eq(agendamentos.lojaId, lojaId)`
- `servicos` → `eq(servicos.lojaId, lojaId)`
- `veiculos` → (via clienteId que pertence a uma loja)
- `pagamentos` → `eq(pagamentos.lojaId, lojaId)`
- `usuariosLojas` → `eq(usuariosLojas.lojaId, lojaId)`

**Padrões problemáticos para identificar:**
```typescript
// ❌ CRÍTICO - sem filtro de tenant
db.select().from(agendamentos)
db.select().from(servicos)

// ✅ CORRETO
db.select().from(agendamentos).where(eq(agendamentos.lojaId, lojaId))
```

**A exceção:** queries feitas no contexto `(master)` não precisam de filtro lojaId pois o master acessa dados globais.

Se encontrar uma query sem o filtro obrigatório:
1. Alerte imediatamente com severidade **CRÍTICO**
2. Mostre a linha exata do problema
3. Proponha a correção antes de prosseguir
