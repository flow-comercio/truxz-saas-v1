import {
  pgTable, text, integer, boolean, timestamp, decimal,
  uuid, pgEnum, index, varchar, json, uniqueIndex
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { lojas, servicos, operadores, usuarios, veiculos, agendamentos, metodoPagamentoEnum } from './core'

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const tipoItemEnum = pgEnum('tipo_item', ['servico', 'produto'])
export const tipoMovimentacaoEnum = pgEnum('tipo_movimentacao', [
  'entrada', 'saida', 'ajuste', 'uso_os', 'venda', 'devolucao'
])
export const statusOrcamentoEnum = pgEnum('status_orcamento', [
  'rascunho', 'enviado', 'aprovado', 'recusado', 'expirado', 'convertido'
])
export const statusOsEnum = pgEnum('status_os', [
  'aberta', 'diagnostico', 'aguardando_aprovacao', 'aprovada',
  'em_execucao', 'aguardando_peca', 'concluida', 'cancelada', 'entregue'
])
export const statusVendaEnum = pgEnum('status_venda', [
  'aberta', 'finalizada', 'cancelada', 'estornada'
])

// ─── CATEGORIAS DE PRODUTO ────────────────────────────────────────────────────
export const categoriasProduto = pgTable('categorias_produto', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 100 }).notNull(),
  cor: varchar('cor', { length: 7 }).default('#9D4EDD'),
  icone: varchar('icone', { length: 50 }),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('cat_produto_loja_idx').on(t.lojaId),
}))

// ─── PRODUTOS ─────────────────────────────────────────────────────────────────
export const produtos = pgTable('produtos', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  categoriaId: uuid('categoria_id').references(() => categoriasProduto.id),
  nome: varchar('nome', { length: 200 }).notNull(),
  descricao: text('descricao'),
  codigoBarras: varchar('codigo_barras', { length: 60 }),
  sku: varchar('sku', { length: 60 }),
  precoCompra: decimal('preco_compra', { precision: 10, scale: 2 }),
  precoVenda: decimal('preco_venda', { precision: 10, scale: 2 }).notNull(),
  unidade: varchar('unidade', { length: 20 }).default('un'),
  imagemUrl: text('imagem_url'),
  comissaoTipo: varchar('comissao_tipo', { length: 20 }),
  comissaoValor: decimal('comissao_valor', { precision: 10, scale: 2 }),
  usadoEmOs: boolean('usado_em_os').default(false),
  vendaAvulsa: boolean('venda_avulsa').default(true),
  ativo: boolean('ativo').default(true),
  ordem: integer('ordem').default(0),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('produtos_loja_idx').on(t.lojaId),
  codigoBarrasIdx: index('produtos_codigo_barras_idx').on(t.codigoBarras),
}))

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
export const estoque = pgTable('estoque', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  produtoId: uuid('produto_id').notNull().references(() => produtos.id, { onDelete: 'cascade' }),
  quantidade: decimal('quantidade', { precision: 10, scale: 3 }).default('0').notNull(),
  quantidadeMinima: decimal('quantidade_minima', { precision: 10, scale: 3 }).default('0'),
  localizacao: varchar('localizacao', { length: 100 }),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  uniqueLojaProduto: uniqueIndex('estoque_loja_produto_unique').on(t.lojaId, t.produtoId),
}))

// ─── MOVIMENTAÇÕES DE ESTOQUE ─────────────────────────────────────────────────
export const movimentacoesEstoque = pgTable('movimentacoes_estoque', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id),
  produtoId: uuid('produto_id').notNull().references(() => produtos.id),
  operadorId: uuid('operador_id').references(() => operadores.id),
  tipo: tipoMovimentacaoEnum('tipo').notNull(),
  quantidade: decimal('quantidade', { precision: 10, scale: 3 }).notNull(),
  quantidadeAnterior: decimal('quantidade_anterior', { precision: 10, scale: 3 }),
  referenciaId: uuid('referencia_id'),
  referenciaTipo: varchar('referencia_tipo', { length: 30 }),
  observacoes: text('observacoes'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('movest_loja_idx').on(t.lojaId),
  produtoIdx: index('movest_produto_idx').on(t.produtoId),
}))

// ─── ORÇAMENTOS ───────────────────────────────────────────────────────────────
export const orcamentos = pgTable('orcamentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  numero: integer('numero').notNull(),
  clienteId: uuid('cliente_id').references(() => usuarios.id),
  veiculoId: uuid('veiculo_id').references(() => veiculos.id),
  operadorId: uuid('operador_id').references(() => operadores.id),
  status: statusOrcamentoEnum('status').default('rascunho'),
  validoAte: timestamp('valido_ate'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  desconto: decimal('desconto', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
  observacoes: text('observacoes'),
  observacoesInternas: text('observacoes_internas'),
  aprovadoEm: timestamp('aprovado_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('orcamentos_loja_idx').on(t.lojaId),
  numeroLojaIdx: index('orcamentos_numero_loja_idx').on(t.lojaId, t.numero),
}))

export const itensOrcamento = pgTable('itens_orcamento', {
  id: uuid('id').defaultRandom().primaryKey(),
  orcamentoId: uuid('orcamento_id').notNull().references(() => orcamentos.id, { onDelete: 'cascade' }),
  tipo: tipoItemEnum('tipo').notNull(),
  servicoId: uuid('servico_id').references(() => servicos.id),
  produtoId: uuid('produto_id').references(() => produtos.id),
  descricao: varchar('descricao', { length: 200 }),
  quantidade: decimal('quantidade', { precision: 10, scale: 3 }).default('1'),
  precoUnitario: decimal('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  desconto: decimal('desconto', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  ordem: integer('ordem').default(0),
})

// ─── ORDENS DE SERVIÇO ────────────────────────────────────────────────────────
export const ordensServico = pgTable('ordens_servico', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  numero: integer('numero').notNull(),
  clienteId: uuid('cliente_id').notNull().references(() => usuarios.id),
  veiculoId: uuid('veiculo_id').references(() => veiculos.id),
  orcamentoId: uuid('orcamento_id').references(() => orcamentos.id),
  agendamentoId: uuid('agendamento_id').references(() => agendamentos.id),
  operadorId: uuid('operador_id').references(() => operadores.id),
  status: statusOsEnum('status').default('aberta'),
  // OCR plate reading
  placaLida: varchar('placa_lida', { length: 10 }),
  placaConfirmada: boolean('placa_confirmada').default(false),
  quilometragem: integer('quilometragem'),
  // Diagnóstico e execução
  diagnostico: text('diagnostico'),
  observacoes: text('observacoes'),
  observacoesInternas: text('observacoes_internas'),
  checklist: json('checklist').$type<{ item: string; ok: boolean | null; obs?: string }[]>(),
  // Fotos
  fotosEntrada: json('fotos_entrada').$type<string[]>(),
  fotosSaida: json('fotos_saida').$type<string[]>(),
  // Aprovação digital
  assinaturaClienteUrl: text('assinatura_cliente_url'),
  // Financeiro
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  desconto: decimal('desconto', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).default('0'),
  // Timestamps do fluxo
  previsaoEntrega: timestamp('previsao_entrega'),
  aprovadoEm: timestamp('aprovado_em'),
  iniciadoEm: timestamp('iniciado_em'),
  concluidoEm: timestamp('concluido_em'),
  entregueEm: timestamp('entregue_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('os_loja_idx').on(t.lojaId),
  statusIdx: index('os_status_idx').on(t.status),
  numeroLojaIdx: uniqueIndex('os_numero_loja_unique').on(t.lojaId, t.numero),
}))

export const itensOs = pgTable('itens_os', {
  id: uuid('id').defaultRandom().primaryKey(),
  osId: uuid('os_id').notNull().references(() => ordensServico.id, { onDelete: 'cascade' }),
  tipo: tipoItemEnum('tipo').notNull(),
  servicoId: uuid('servico_id').references(() => servicos.id),
  produtoId: uuid('produto_id').references(() => produtos.id),
  descricao: varchar('descricao', { length: 200 }),
  quantidade: decimal('quantidade', { precision: 10, scale: 3 }).default('1'),
  precoUnitario: decimal('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  estoqueDebitado: boolean('estoque_debitado').default(false),
})

// ─── VENDAS (PDV) ─────────────────────────────────────────────────────────────
export const vendas = pgTable('vendas', {
  id: uuid('id').defaultRandom().primaryKey(),
  lojaId: uuid('loja_id').notNull().references(() => lojas.id, { onDelete: 'cascade' }),
  numero: integer('numero').notNull(),
  operadorId: uuid('operador_id').references(() => operadores.id),
  clienteId: uuid('cliente_id').references(() => usuarios.id),
  osId: uuid('os_id').references(() => ordensServico.id),
  status: statusVendaEnum('status').default('aberta'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  desconto: decimal('desconto', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
  metodo: metodoPagamentoEnum('metodo'),
  observacoes: text('observacoes'),
  finalizadoEm: timestamp('finalizado_em'),
  criadoEm: timestamp('criado_em').defaultNow(),
}, (t) => ({
  lojaIdx: index('vendas_loja_idx').on(t.lojaId),
  numeroLojaIdx: uniqueIndex('vendas_numero_loja_unique').on(t.lojaId, t.numero),
}))

export const itensVenda = pgTable('itens_venda', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendaId: uuid('venda_id').notNull().references(() => vendas.id, { onDelete: 'cascade' }),
  tipo: tipoItemEnum('tipo').notNull(),
  produtoId: uuid('produto_id').references(() => produtos.id),
  servicoId: uuid('servico_id').references(() => servicos.id),
  descricao: varchar('descricao', { length: 200 }),
  quantidade: decimal('quantidade', { precision: 10, scale: 3 }).default('1'),
  precoUnitario: decimal('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
})

// ─── RELATIONS ────────────────────────────────────────────────────────────────
export const produtosRelations = relations(produtos, ({ one, many }) => ({
  loja: one(lojas, { fields: [produtos.lojaId], references: [lojas.id] }),
  categoria: one(categoriasProduto, { fields: [produtos.categoriaId], references: [categoriasProduto.id] }),
  estoqueItem: one(estoque, { fields: [produtos.id], references: [estoque.produtoId] }),
  movimentacoes: many(movimentacoesEstoque),
  itensOs: many(itensOs),
  itensVenda: many(itensVenda),
}))

export const ordensServicoRelations = relations(ordensServico, ({ one, many }) => ({
  loja: one(lojas, { fields: [ordensServico.lojaId], references: [lojas.id] }),
  cliente: one(usuarios, { fields: [ordensServico.clienteId], references: [usuarios.id] }),
  veiculo: one(veiculos, { fields: [ordensServico.veiculoId], references: [veiculos.id] }),
  orcamento: one(orcamentos, { fields: [ordensServico.orcamentoId], references: [orcamentos.id] }),
  agendamento: one(agendamentos, { fields: [ordensServico.agendamentoId], references: [agendamentos.id] }),
  operador: one(operadores, { fields: [ordensServico.operadorId], references: [operadores.id] }),
  itens: many(itensOs),
}))

export const orcamentosRelations = relations(orcamentos, ({ one, many }) => ({
  loja: one(lojas, { fields: [orcamentos.lojaId], references: [lojas.id] }),
  cliente: one(usuarios, { fields: [orcamentos.clienteId], references: [usuarios.id] }),
  veiculo: one(veiculos, { fields: [orcamentos.veiculoId], references: [veiculos.id] }),
  operador: one(operadores, { fields: [orcamentos.operadorId], references: [operadores.id] }),
  itens: many(itensOrcamento),
  os: many(ordensServico),
}))

export const vendasRelations = relations(vendas, ({ one, many }) => ({
  loja: one(lojas, { fields: [vendas.lojaId], references: [lojas.id] }),
  operador: one(operadores, { fields: [vendas.operadorId], references: [operadores.id] }),
  cliente: one(usuarios, { fields: [vendas.clienteId], references: [usuarios.id] }),
  os: one(ordensServico, { fields: [vendas.osId], references: [ordensServico.id] }),
  itens: many(itensVenda),
}))
