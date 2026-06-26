import {
  pgTable, text, integer, boolean, timestamp, decimal,
  uuid, pgEnum, index, varchar
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { lojas, usuarios } from './core'

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const estagioLeadEnum = pgEnum('estagio_lead', [
  'novo', 'contatado', 'proposta', 'negociando', 'ganho', 'perdido'
])
export const origemLeadEnum = pgEnum('origem_lead', [
  'app', 'instagram', 'indicacao', 'whatsapp', 'google', 'walk_in', 'outro'
])
export const tipoInteracaoEnum = pgEnum('tipo_interacao', [
  'mensagem', 'ligacao', 'visita', 'proposta', 'followup', 'nota'
])

// ─── LEADS (CRM PIPELINE) ────────────────────────────────────────────────────
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  responsavelId: uuid('responsavel_id').references(() => usuarios.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  telefone: varchar('telefone', { length: 30 }),
  email: varchar('email', { length: 200 }),
  veiculo: varchar('veiculo', { length: 200 }),
  origem: origemLeadEnum('origem').default('outro'),
  estagio: estagioLeadEnum('estagio').default('novo'),
  valorEstimado: decimal('valor_estimado', { precision: 10, scale: 2 }),
  observacoes: text('observacoes'),
  convertidoEm: timestamp('convertido_em'),
  clienteId: uuid('cliente_id').references(() => usuarios.id),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('leads_loja_idx').on(t.lojaId),
  estagioIdx: index('leads_estagio_idx').on(t.estagio),
}))

// ─── INTERAÇÕES DO LEAD (TIMELINE CRM) ────────────────────────────────────────
export const interacoesLead = pgTable('interacoes_lead', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  autorId: uuid('autor_id').references(() => usuarios.id),
  tipo: tipoInteracaoEnum('tipo').notNull(),
  conteudo: text('conteudo').notNull(),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  leadIdx: index('interacoes_lead_idx').on(t.leadId),
}))

// ─── PUSH SUBSCRIPTIONS (PWA) ─────────────────────────────────────────────────
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  lojaId: uuid('loja_id').references(() => lojas.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  usuarioIdx: index('push_usuario_idx').on(t.usuarioId),
  lojaIdx: index('push_loja_idx').on(t.lojaId),
}))

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const leadsRelations = relations(leads, ({ one, many }) => ({
  loja: one(lojas, { fields: [leads.lojaId], references: [lojas.id] }),
  responsavel: one(usuarios, { fields: [leads.responsavelId], references: [usuarios.id] }),
  cliente: one(usuarios, { fields: [leads.clienteId], references: [usuarios.id] }),
  interacoes: many(interacoesLead),
}))

export const interacoesLeadRelations = relations(interacoesLead, ({ one }) => ({
  lead: one(leads, { fields: [interacoesLead.leadId], references: [leads.id] }),
  autor: one(usuarios, { fields: [interacoesLead.autorId], references: [usuarios.id] }),
}))

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  usuario: one(usuarios, { fields: [pushSubscriptions.usuarioId], references: [usuarios.id] }),
  loja: one(lojas, { fields: [pushSubscriptions.lojaId], references: [lojas.id] }),
}))
