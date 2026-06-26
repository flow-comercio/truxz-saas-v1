import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { vendas, itensVenda, produtos, estoque, movimentacoesEstoque, operadores, comissoes } from '@/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const rows = await db.select({
    id: vendas.id,
    numero: vendas.numero,
    status: vendas.status,
    total: vendas.total,
    metodo: vendas.metodo,
    finalizadoEm: vendas.finalizadoEm,
    criadoEm: vendas.criadoEm,
  })
    .from(vendas)
    .where(eq(vendas.lojaId, lojaId))
    .orderBy(desc(vendas.criadoEm))
    .limit(100)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId!

  const { itens, clienteId, metodo, desconto = 0, observacoes } = await req.json()
  if (!itens?.length) return NextResponse.json({ error: 'Adicione ao menos um item' }, { status: 400 })
  if (!metodo) return NextResponse.json({ error: 'Informe o método de pagamento' }, { status: 400 })

  const [{ max }] = await db.select({ max: sql<number>`COALESCE(MAX(numero),0)` })
    .from(vendas).where(eq(vendas.lojaId, lojaId))

  const subtotal = itens.reduce((s: number, i: any) => s + parseFloat(i.total), 0)
  const total = subtotal - parseFloat(desconto)
  const now = new Date()

  const [op] = await db.select({ id: operadores.id })
    .from(operadores)
    .where(and(eq(operadores.lojaId, lojaId), eq(operadores.usuarioId, session.user.id)))
    .limit(1)

  const [venda] = await db.insert(vendas).values({
    lojaId,
    numero: max + 1,
    clienteId: clienteId ?? null,
    operadorId: op?.id ?? null,
    status: 'finalizada',
    subtotal: subtotal.toFixed(2),
    desconto: parseFloat(desconto).toFixed(2),
    total: total.toFixed(2),
    metodo,
    observacoes,
    finalizadoEm: now,
  }).returning()

  await db.insert(itensVenda).values(itens.map((item: any) => ({
    vendaId: venda.id,
    tipo: item.tipo ?? 'produto',
    produtoId: item.produtoId ?? null,
    servicoId: item.servicoId ?? null,
    descricao: item.descricao,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    total: item.total,
  })))

  // Debitar estoque e calcular comissões por produto
  const itensProduto = itens.filter((i: any) => i.produtoId)
  if (itensProduto.length > 0) {
    const produtoIds = itensProduto.map((i: any) => i.produtoId)

    const [produtosConfig, ...movimentacoes] = await Promise.all([
      db.select({ id: produtos.id, comissaoTipo: produtos.comissaoTipo, comissaoValor: produtos.comissaoValor })
        .from(produtos)
        .where(inArray(produtos.id, produtoIds)),
      ...itensProduto.map((item: any) =>
        db.update(estoque)
          .set({ quantidade: sql`quantidade - ${item.quantidade}`, atualizadoEm: now })
          .where(and(eq(estoque.produtoId, item.produtoId), eq(estoque.lojaId, lojaId)))
      ),
    ])

    await db.insert(movimentacoesEstoque).values(itensProduto.map((item: any) => ({
      lojaId,
      produtoId: item.produtoId,
      operadorId: op?.id ?? null,
      tipo: 'venda' as const,
      quantidade: item.quantidade,
      referenciaId: venda.id,
      referenciaTipo: 'venda',
    })))

    // Gerar comissões por produto se houver operador e configuração
    if (op?.id) {
      let totalComissao = 0
      for (const item of itensProduto) {
        const config = produtosConfig.find((p: any) => p.id === item.produtoId)
        if (!config?.comissaoTipo || !config?.comissaoValor) continue

        const totalItem = parseFloat(item.total)
        const qtd = parseFloat(item.quantidade)
        const valor = parseFloat(config.comissaoValor)

        if (config.comissaoTipo === 'percentual') {
          totalComissao += totalItem * valor / 100
        } else if (config.comissaoTipo === 'fixo') {
          totalComissao += valor * qtd
        }
      }

      if (totalComissao > 0) {
        await db.insert(comissoes).values({
          lojaId,
          operadorId: op.id,
          referenciaId: venda.id,
          referenciaTipo: 'venda',
          valor: totalComissao.toFixed(2),
        })
      }
    }
  }

  return NextResponse.json(venda, { status: 201 })
}
