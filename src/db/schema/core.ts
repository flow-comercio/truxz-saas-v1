import {
  pgTable, text, integer, boolean, timestamp, decimal,
  uuid, pgEnum, index, varchar, json
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── ENUMS ───────────────────────────────────────────────────────────────────
export const planoEnum = pgEnum('plano_tipo', ['basico', 'profissional', 'premium'])
export const statusLojaEnum = pgEnum('status_loja', ['ativa', 'inativa', 'suspensa', 'trial'])
export const statusAgendamentoEnum = pgEnum('status_agendamento', [
  'pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show'
])
export const statusPagamentoEnum = pgEnum('status_pagamento', [
  'pendente', 'pago', 'cancelado', 'estornado', 'vencido'
])
export const roleEnum = pgEnum('role_usuario', [
  'master', 'admin_loja', 'operador', 'cliente'
])
export const metodoPagamentoEnum = pgEnum('metodo_pagamento', [
  'pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'asaas'
])

// ─── PLANOS ───────────────────────────────────────────────────────────────────
export const planos = pgTable('planos', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 100 }).notNull(),
  tipo: planoEnum('tipo').notNull(),
  descricao: text('descricao'),
  preco: decimal('preco', { precision: 10, scale: 2 }).notNull(),
  limiteAgendamentosMes: integer('limite_agendamentos_mes').default(100),
  limiteOperadores: integer('limite_operadores').default(3),
  permiteRelatorios: boolean('permite_relatorios').default(false),
  permiteWhatsapp: boolean('permite_whatsapp').default(false),
  permiteIA: boolean('permite_ia').default(false),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
})

// ─── LOJAS ────────────────────────────────────────────────────────────────────
export const lojas = pgTable('lojas', {
  id: uuid('id').defaultRandom().primaryKey(),
  planoId: uuid('plano_id').references(() => planos.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  cnpj: varchar('cnpj', { length: 20 }),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email', { length: 200 }),
  logradouro: varchar('logradouro', { length: 300 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  logoUrl: text('logo_url'),
  corPrimaria: varchar('cor_primaria', { length: 7 }).default('#ea580c'),
  status: statusLojaEnum('status').default('trial'),
  trialExpiraEm: timestamp('trial_expira_em'),
  asaasCustomerId: text('asaas_customer_id'),
  asaasSubscriptionId: text('asaas_subscription_id'),
  configuracoes: json('configuracoes').$type<{
    horarioAbertura: string
    horarioFechamento: string
    diasFuncionamento: number[]
    intervaloAgendamento: number
    mensagemBoasVindas: string
    notificacaoWhatsapp: boolean
  }>(),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  slugIdx: index('lojas_slug_idx').on(t.slug),
}))

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────
export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').references(() => lojas.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  telefone: varchar('telefone', { length: 20 }),
  role: roleEnum('role').default('cliente'),
  ativo: boolean('ativo').default(true),
  emailVerificado: boolean('email_verificado').default(true),
  avatarUrl: text('avatar_url'),
  asaasCustomerId: text('asaas_customer_id'),
  ultimoAcessoEm: timestamp('ultimo_acesso_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  emailIdx: index('usuarios_email_idx').on(t.email),
  lojaIdx: index('usuarios_loja_idx').on(t.lojaId),
}))

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────
export const veiculos = pgTable('veiculos', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  placa: varchar('placa', { length: 10 }).notNull(),
  marca: varchar('marca', { length: 100 }),
  modelo: varchar('modelo', { length: 100 }),
  ano: integer('ano'),
  cor: varchar('cor', { length: 50 }),
  tipo: varchar('tipo', { length: 50 }).default('carro'),
  observacoes: text('observacoes'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  placaLojaIdx: index('veiculos_placa_loja_idx').on(t.placa, t.lojaId),
}))

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────
export const servicos = pgTable('servicos', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  preco: decimal('preco', { precision: 10, scale: 2 }).notNull(),
  duracaoMinutos: integer('duracao_minutos').notNull().default(60),
  categoria: varchar('categoria', { length: 100 }),
  imagemUrl: text('imagem_url'),
  ativo: boolean('ativo').default(true),
  ordem: integer('ordem').default(0),
  criadoEm: timestamp('criado_em').defaultNow(),
})

// ─── OPERADORES (funcionários) ────────────────────────────────────────────────
export const operadores = pgTable('operadores', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  especialidades: json('especialidades').$type<string[]>(),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
})

// ─── AGENDAMENTOS ─────────────────────────────────────────────────────────────
export const agendamentos = pgTable('agendamentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  clienteId: uuid('cliente_id').notNull().references(() => usuarios.id),
  veiculoId: uuid('veiculo_id').references(() => veiculos.id),
  operadorId: uuid('operador_id').references(() => operadores.id),
  servicoId: uuid('servico_id').notNull().references(() => servicos.id),
  status: statusAgendamentoEnum('status').default('pendente'),
  dataHoraInicio: timestamp('data_hora_inicio').notNull(),
  dataHoraFim: timestamp('data_hora_fim'),
  precoTotal: decimal('preco_total', { precision: 10, scale: 2 }).notNull(),
  observacoes: text('observacoes'),
  observacoesInternas: text('observacoes_internas'),
  fotoAntes: json('foto_antes').$type<string[]>(),
  fotoDepois: json('foto_depois').$type<string[]>(),
  avaliacao: integer('avaliacao'),
  comentarioAvaliacao: text('comentario_avaliacao'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojaDataIdx: index('agendamentos_loja_data_idx').on(t.lojaId, t.dataHoraInicio),
  clienteIdx: index('agendamentos_cliente_idx').on(t.clienteId),
  statusIdx: index('agendamentos_status_idx').on(t.status),
}))

// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────
export const pagamentos = pgTable('pagamentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  agendamentoId: uuid('agendamento_id').notNull().references(() => agendamentos.id),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  valor: decimal('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: metodoPagamentoEnum('metodo').default('pix'),
  status: statusPagamentoEnum('status').default('pendente'),
  asaasPaymentId: text('asaas_payment_id'),
  asaasPixQrCode: text('asaas_pix_qr_code'),
  asaasPixCopiaCola: text('asaas_pix_copia_cola'),
  pagoEm: timestamp('pago_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
})

// ─── ASSINATURAS (lojas pagando o SaaS) ──────────────────────────────────────
export const assinaturas = pgTable('assinaturas', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  planoId: uuid('plano_id').notNull().references(() => planos.id),
  status: statusPagamentoEnum('status').default('pendente'),
  asaasSubscriptionId: text('asaas_subscription_id'),
  proximoVencimento: timestamp('proximo_vencimento'),
  criadoEm: timestamp('criado_em').defaultNow(),
  canceladoEm: timestamp('cancelado_em'),
})

// ─── TOKENS (recuperação de senha) ───────────────────────────────────────────
export const tokens = pgTable('tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuarioId: uuid('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  tipo: varchar('tipo', { length: 30 }).notNull().default('recuperar_senha'),
  expiraEm: timestamp('expira_em').notNull(),
  usadoEm: timestamp('usado_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  tokenIdx: index('tokens_token_idx').on(t.token),
}))

// ─── LIMITE DE PLANO (cache de uso mensal) ───────────────────────────────────
export const usoMensal = pgTable('uso_mensal', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  mes: varchar('mes', { length: 7 }).notNull(),   // "2024-11"
  agendamentosCount: integer('agendamentos_count').default(0),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojasMesIdx: index('uso_mensal_loja_mes_idx').on(t.lojaId, t.mes),
}))

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const lojasRelations = relations(lojas, ({ one, many }) => ({
  plano: one(planos, { fields: [lojas.planoId], references: [planos.id] }),
  usuarios: many(usuarios),
  servicos: many(servicos),
  agendamentos: many(agendamentos),
  operadores: many(operadores),
  veiculos: many(veiculos),
}))

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  loja: one(lojas, { fields: [usuarios.lojaId], references: [lojas.id] }),
  veiculos: many(veiculos),
  agendamentos: many(agendamentos),
}))

export const agendamentosRelations = relations(agendamentos, ({ one }) => ({
  loja: one(lojas, { fields: [agendamentos.lojaId], references: [lojas.id] }),
  cliente: one(usuarios, { fields: [agendamentos.clienteId], references: [usuarios.id] }),
  veiculo: one(veiculos, { fields: [agendamentos.veiculoId], references: [veiculos.id] }),
  servico: one(servicos, { fields: [agendamentos.servicoId], references: [servicos.id] }),
  operador: one(operadores, { fields: [agendamentos.operadorId], references: [operadores.id] }),
  pagamento: one(pagamentos, { fields: [agendamentos.id], references: [pagamentos.agendamentoId] }),
}))
