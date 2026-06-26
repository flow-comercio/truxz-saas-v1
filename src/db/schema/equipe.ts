import {
  pgTable, text, integer, boolean, timestamp, decimal,
  uuid, pgEnum, index, varchar, json, uniqueIndex
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { lojas, operadores, usuarios, servicos } from './core'

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const tipoComissaoEnum = pgEnum('tipo_comissao', [
  'percentual_receita', 'fixo_por_os', 'fixo_por_servico', 'percentual_por_servico'
])
export const periodoMetaEnum = pgEnum('periodo_meta', ['semanal', 'mensal'])
export const tipoMetaEnum = pgEnum('tipo_meta', [
  'agendamentos', 'receita', 'os_concluidas', 'nota_media', 'produtos_vendidos'
])
export const statusComissaoEnum = pgEnum('status_comissao', ['pendente', 'aprovada', 'paga', 'cancelada'])

// ─── PERMISSÕES POR OPERADOR ──────────────────────────────────────────────────
// O lojista define quais módulos cada funcionário pode acessar
export const permissoesOperador = pgTable('permissoes_operador', {
  id: uuid('id').defaultRandom().primaryKey(),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id, { onDelete: 'cascade' }),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  // Módulos da PWA
  acessoFila: boolean('acesso_fila').default(true),
  acessoOs: boolean('acesso_os').default(true),
  acessoEstoque: boolean('acesso_estoque').default(false),
  acessoFinanceiro: boolean('acesso_financeiro').default(false),
  acessoRelatorios: boolean('acesso_relatorios').default(false),
  acessoVendas: boolean('acesso_vendas').default(false),
  acessoClientes: boolean('acesso_clientes').default(true),
  acessoAgendamentos: boolean('acesso_agendamentos').default(true),
  acessoCatalogo: boolean('acesso_catalogo').default(false),
  // Permissões granulares
  podeEditarServicos: boolean('pode_editar_servicos').default(false),
  podeCancelarOs: boolean('pode_cancelar_os').default(false),
  podeDarDesconto: boolean('pode_dar_desconto').default(false),
  limiteDesconto: decimal('limite_desconto', { precision: 5, scale: 2 }).default('0'),
  podeVerComissoes: boolean('pode_ver_comissoes').default(true),
  podeVerRanking: boolean('pode_ver_ranking').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  operadorUniqueIdx: uniqueIndex('permissoes_operador_unique').on(t.operadorId),
}))

// ─── CONFIGURAÇÃO DE COMISSÕES ────────────────────────────────────────────────
export const configComissoes = pgTable('config_comissoes', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id, { onDelete: 'cascade' }),
  tipo: tipoComissaoEnum('tipo').notNull(),
  percentual: decimal('percentual', { precision: 5, scale: 2 }),
  valorFixo: decimal('valor_fixo', { precision: 10, scale: 2 }),
  servicosIds: json('servicos_ids').$type<string[]>(),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaOperadorIdx: index('config_com_loja_op_idx').on(t.lojaId, t.operadorId),
}))

// ─── METAS ────────────────────────────────────────────────────────────────────
export const metas = pgTable('metas', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  operadorId: uuid('operador_id').references(() => operadores.id),
  tipo: tipoMetaEnum('tipo').notNull(),
  periodo: periodoMetaEnum('periodo').notNull(),
  valorMeta: decimal('valor_meta', { precision: 10, scale: 2 }).notNull(),
  mes: varchar('mes', { length: 7 }),
  semana: varchar('semana', { length: 10 }),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('metas_loja_idx').on(t.lojaId),
}))

// ─── COMISSÕES GERADAS ────────────────────────────────────────────────────────
export const comissoes = pgTable('comissoes', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id),
  referenciaId: uuid('referencia_id').notNull(),
  referenciaTipo: varchar('referencia_tipo', { length: 30 }).notNull(),
  valor: decimal('valor', { precision: 10, scale: 2 }).notNull(),
  status: statusComissaoEnum('status').default('pendente'),
  pagoEm: timestamp('pago_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('comissoes_loja_idx').on(t.lojaId),
  operadorIdx: index('comissoes_operador_idx').on(t.operadorId),
}))

// ─── GAMIFICAÇÃO: XP POR OPERADOR ────────────────────────────────────────────
export const xpOperador = pgTable('xp_operador', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id),
  pontosAtuais: integer('pontos_atuais').default(0),
  nivel: integer('nivel').default(1),
  totalHistorico: integer('total_historico').default(0),
  streakDias: integer('streak_dias').default(0),
  ultimaAtividadeEm: timestamp('ultima_atividade_em'),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  uniqueLojaOp: uniqueIndex('xp_loja_operador_unique').on(t.lojaId, t.operadorId),
}))

// ─── EVENTOS DE XP (histórico de pontuação) ───────────────────────────────────
// Cada ação valorizada gera um evento com pontos
export const eventosXp = pgTable('eventos_xp', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id),
  tipo: varchar('tipo', { length: 60 }).notNull(),
  pontos: integer('pontos').notNull(),
  descricao: varchar('descricao', { length: 200 }),
  referenciaId: uuid('referencia_id'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaOpIdx: index('eventos_xp_loja_op_idx').on(t.lojaId, t.operadorId),
}))

// ─── CONQUISTAS / BADGES ──────────────────────────────────────────────────────
export const conquistas = pgTable('conquistas', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigo: varchar('codigo', { length: 60 }).notNull().unique(),
  nome: varchar('nome', { length: 100 }).notNull(),
  descricao: text('descricao'),
  icone: varchar('icone', { length: 50 }),
  cor: varchar('cor', { length: 7 }).default('#9D4EDD'),
  pontosRecompensa: integer('pontos_recompensa').default(0),
  criadoEm: timestamp('criado_em').defaultNow(),
})

export const conquistasOperador = pgTable('conquistas_operador', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  operadorId: uuid('operador_id').notNull().references(() => operadores.id),
  conquistaId: uuid('conquista_id').notNull().references(() => conquistas.id),
  desbloqueadoEm: timestamp('desbloqueado_em').defaultNow(),
}, (t) => ({
  uniqueOpConquista: uniqueIndex('conquistas_op_unique').on(t.operadorId, t.conquistaId),
}))

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const permissoesRelations = relations(permissoesOperador, ({ one }) => ({
  operador: one(operadores, { fields: [permissoesOperador.operadorId], references: [operadores.id] }),
  loja: one(lojas, { fields: [permissoesOperador.lojaId], references: [lojas.id] }),
}))

export const xpOperadorRelations = relations(xpOperador, ({ one, many }) => ({
  operador: one(operadores, { fields: [xpOperador.operadorId], references: [operadores.id] }),
  loja: one(lojas, { fields: [xpOperador.lojaId], references: [lojas.id] }),
  eventos: many(eventosXp),
}))

export const metasRelations = relations(metas, ({ one }) => ({
  loja: one(lojas, { fields: [metas.lojaId], references: [lojas.id] }),
  operador: one(operadores, { fields: [metas.operadorId], references: [operadores.id] }),
}))

export const comissoesRelations = relations(comissoes, ({ one }) => ({
  loja: one(lojas, { fields: [comissoes.lojaId], references: [lojas.id] }),
  operador: one(operadores, { fields: [comissoes.operadorId], references: [operadores.id] }),
}))
