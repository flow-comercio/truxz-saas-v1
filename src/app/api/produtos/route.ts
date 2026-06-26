import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { produtos, categoriasProduto, estoque } from '@/db/schema'
import { eq, and, ilike, or } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const codigo = searchParams.get('codigo')

  let where: any = eq(produtos.lojaId, lojaId)

  if (codigo) {
    where = and(eq(produtos.lojaId, lojaId), eq(produtos.codigoBarras, codigo))
  } else if (q) {
    where = and(
      eq(produtos.lojaId, lojaId),
      or(ilike(produtos.nome, `%${q}%`), ilike(produtos.codigoBarras, `%${q}%`))
    )
  }

  const rows = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      codigoBarras: produtos.codigoBarras,
      sku: produtos.sku,
      precoVenda: produtos.precoVenda,
      precoCompra: produtos.precoCompra,
      unidade: produtos.unidade,
      imagemUrl: produtos.imagemUrl,
      ativo: produtos.ativo,
      usadoEmOs: produtos.usadoEmOs,
      vendaAvulsa: produtos.vendaAvulsa,
      comissaoTipo: produtos.comissaoTipo,
      comissaoValor: produtos.comissaoValor,
      categoriaNome: categoriasProduto.nome,
      quantidadeEstoque: estoque.quantidade,
      quantidadeMinima: estoque.quantidadeMinima,
    })
    .from(produtos)
    .leftJoin(categoriasProduto, eq(produtos.categoriaId, categoriasProduto.id))
    .leftJoin(estoque, and(eq(estoque.produtoId, produtos.id), eq(estoque.lojaId, lojaId)))
    .where(where)
    .limit(100)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const body = await req.json()

  const [novo] = await db.insert(produtos).values({
    lojaId,
    nome: body.nome,
    descricao: body.descricao ?? null,
    codigoBarras: body.codigoBarras ?? null,
    sku: body.sku ?? null,
    precoCompra: body.precoCompra ?? null,
    precoVenda: body.precoVenda,
    unidade: body.unidade ?? 'un',
    imagemUrl: body.imagemUrl ?? null,
    categoriaId: body.categoriaId ?? null,
    usadoEmOs: body.usadoEmOs ?? false,
    vendaAvulsa: body.vendaAvulsa ?? true,
    comissaoTipo: body.comissaoTipo || null,
    comissaoValor: body.comissaoValor || null,
  }).returning()

  await db.insert(estoque).values({
    lojaId,
    produtoId: novo.id,
    quantidade: body.estoqueInicial ?? '0',
    quantidadeMinima: body.estoqueMinimo ?? '0',
  }).onConflictDoNothing()

  return NextResponse.json(novo, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const set: Record<string, any> = { atualizadoEm: new Date() }
  if (fields.nome !== undefined) set.nome = fields.nome
  if (fields.precoVenda !== undefined) set.precoVenda = fields.precoVenda
  if (fields.precoCompra !== undefined) set.precoCompra = fields.precoCompra || null
  if (fields.codigoBarras !== undefined) set.codigoBarras = fields.codigoBarras || null
  if (fields.unidade !== undefined) set.unidade = fields.unidade
  if ('comissaoTipo' in fields) set.comissaoTipo = fields.comissaoTipo || null
  if ('comissaoValor' in fields) set.comissaoValor = fields.comissaoValor || null

  const [updated] = await db.update(produtos)
    .set(set)
    .where(and(eq(produtos.id, id), eq(produtos.lojaId, lojaId)))
    .returning()

  return NextResponse.json(updated)
}
