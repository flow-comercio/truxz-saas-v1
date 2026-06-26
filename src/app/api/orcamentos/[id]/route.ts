import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import {
  orcamentos, itensOrcamento, ordensServico, itensOs,
  usuarios, veiculos, servicos, produtos
} from '@/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import { sendPushToLoja } from '@/lib/push'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [orc] = await db.select()
    .from(orcamentos)
    .where(and(eq(orcamentos.id, params.id), eq(orcamentos.lojaId, session.user.lojaId!)))
    .limit(1)
  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const itens = await db.select({
    id: itensOrcamento.id,
    tipo: itensOrcamento.tipo,
    descricao: itensOrcamento.descricao,
    quantidade: itensOrcamento.quantidade,
    precoUnitario: itensOrcamento.precoUnitario,
    desconto: itensOrcamento.desconto,
    total: itensOrcamento.total,
    ordem: itensOrcamento.ordem,
    servicoId: itensOrcamento.servicoId,
    produtoId: itensOrcamento.produtoId,
    servicoNome: servicos.nome,
    produtoNome: produtos.nome,
  })
    .from(itensOrcamento)
    .leftJoin(servicos, eq(itensOrcamento.servicoId, servicos.id))
    .leftJoin(produtos, eq(itensOrcamento.produtoId, produtos.id))
    .where(eq(itensOrcamento.orcamentoId, params.id))
    .orderBy(itensOrcamento.ordem)

  const [cliente] = orc.clienteId
    ? await db.select({ nome: usuarios.nome, telefone: usuarios.telefone, email: usuarios.email })
        .from(usuarios).where(eq(usuarios.id, orc.clienteId)).limit(1)
    : [null]

  const veiculo = orc.veiculoId
    ? await db.select().from(veiculos).where(eq(veiculos.id, orc.veiculoId)).limit(1).then(r => r[0])
    : null

  return NextResponse.json({ ...orc, itens, cliente, veiculo })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { itens, ...campos } = body
  const now = new Date()

  if (campos.status === 'aprovado') campos.aprovadoEm = now

  const [updated] = await db.update(orcamentos)
    .set({ ...campos, atualizadoEm: now })
    .where(and(eq(orcamentos.id, params.id), eq(orcamentos.lojaId, session.user.lojaId!)))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (itens && Array.isArray(itens)) {
    await db.delete(itensOrcamento).where(eq(itensOrcamento.orcamentoId, params.id))
    if (itens.length > 0) {
      await db.insert(itensOrcamento).values(itens.map((item: any, i: number) => ({
        ...item, orcamentoId: params.id, ordem: i,
      })))
    }
    // Recalcular totais
    const [agg] = await db.select({
      subtotal: sql<string>`COALESCE(SUM(${itensOrcamento.total}),0)`,
    }).from(itensOrcamento).where(eq(itensOrcamento.orcamentoId, params.id))

    const subtotal = parseFloat(agg.subtotal)
    const desconto = parseFloat(campos.desconto ?? updated.desconto ?? '0')
    await db.update(orcamentos)
      .set({ subtotal: subtotal.toString(), total: (subtotal - desconto).toString() })
      .where(eq(orcamentos.id, params.id))
  }

  return NextResponse.json(updated)
}

// Converter orçamento em OS
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const [orc] = await db.select()
    .from(orcamentos)
    .where(and(eq(orcamentos.id, params.id), eq(orcamentos.lojaId, lojaId)))
    .limit(1)
  if (!orc) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (!orc.clienteId) return NextResponse.json({ error: 'Orçamento sem cliente — adicione um cliente antes de converter' }, { status: 400 })

  const itens = await db.select().from(itensOrcamento).where(eq(itensOrcamento.orcamentoId, params.id))

  // Próximo número de OS
  const [{ max }] = await db.select({ max: sql<number>`COALESCE(MAX(numero),0)` })
    .from(ordensServico).where(eq(ordensServico.lojaId, lojaId))

  const [os] = await db.insert(ordensServico).values({
    lojaId,
    numero: max + 1,
    clienteId: orc.clienteId,
    veiculoId: orc.veiculoId,
    orcamentoId: orc.id,
    status: 'aberta',
    subtotal: orc.subtotal,
    desconto: orc.desconto,
    total: orc.total,
    observacoes: orc.observacoes,
  }).returning()

  if (itens.length > 0) {
    await db.insert(itensOs).values(itens.map(item => ({
      osId: os.id,
      tipo: item.tipo,
      servicoId: item.servicoId,
      produtoId: item.produtoId,
      descricao: item.descricao,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      total: item.total,
    })))
  }

  await db.update(orcamentos)
    .set({ status: 'convertido', atualizadoEm: new Date() })
    .where(eq(orcamentos.id, params.id))

  await sendPushToLoja(lojaId, {
    title: 'Nova OS criada',
    body: `OS #${os.numero} gerada a partir do Orçamento #${orc.numero}`,
    url: `/admin/os/${os.id}`,
    tag: `os-${os.id}`,
  }).catch(() => {})

  return NextResponse.json({ os, message: `OS #${os.numero} criada com sucesso` })
}
