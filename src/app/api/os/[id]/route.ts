import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import {
  ordensServico, itensOs, usuarios, veiculos, servicos,
  operadores, movimentacoesEstoque, estoque, xpOperador, eventosXp,
  configComissoes, comissoes, conquistas, conquistasOperador,
} from '@/db/schema'
import { eq, and, sql, count, inArray } from 'drizzle-orm'
import { sendPushToUser } from '@/lib/push'

async function verificarEConcederConquistas(
  lojaId: string,
  operadorId: string,
  totalOsConcluidas: number,
  temAssinatura: boolean,
) {
  const codigos: string[] = []

  if (totalOsConcluidas === 1) codigos.push('primeira_os')
  if (totalOsConcluidas >= 10) codigos.push('os_10')
  if (totalOsConcluidas >= 50) codigos.push('os_50')
  if (totalOsConcluidas >= 100) codigos.push('os_100')
  if (temAssinatura) codigos.push('assinatura_coletada')

  if (!codigos.length) return

  const [conquistasDisp, jaDesbloqueadas] = await Promise.all([
    db.select().from(conquistas).where(inArray(conquistas.codigo, codigos)),
    db.select({ conquistaId: conquistasOperador.conquistaId })
      .from(conquistasOperador)
      .where(eq(conquistasOperador.operadorId, operadorId)),
  ])

  const jaDesbloqueadasIds = new Set(jaDesbloqueadas.map(c => c.conquistaId))
  const novas = conquistasDisp.filter(c => !jaDesbloqueadasIds.has(c.id))

  if (!novas.length) return

  const [op] = await db.select({ usuarioId: operadores.usuarioId })
    .from(operadores).where(eq(operadores.id, operadorId)).limit(1)

  for (const conquista of novas) {
    await db.insert(conquistasOperador).values({ lojaId, operadorId, conquistaId: conquista.id })
    if (conquista.pontosRecompensa && conquista.pontosRecompensa > 0) {
      await db.insert(xpOperador).values({
        lojaId, operadorId,
        pontosAtuais: conquista.pontosRecompensa, totalHistorico: conquista.pontosRecompensa,
        nivel: 1,
      }).onConflictDoUpdate({
        target: [xpOperador.lojaId, xpOperador.operadorId],
        set: {
          pontosAtuais: sql`${xpOperador.pontosAtuais} + ${conquista.pontosRecompensa}`,
          totalHistorico: sql`${xpOperador.totalHistorico} + ${conquista.pontosRecompensa}`,
        },
      })
      await db.insert(eventosXp).values({
        lojaId, operadorId,
        tipo: 'conquista', pontos: conquista.pontosRecompensa,
        descricao: `Conquista desbloqueada: ${conquista.nome}`,
        referenciaId: conquista.id,
      })
    }

    if (op?.usuarioId) {
      sendPushToUser(op.usuarioId, {
        title: `${conquista.icone ?? '🏆'} Conquista desbloqueada!`,
        body: `${conquista.nome}${conquista.pontosRecompensa ? ` · +${conquista.pontosRecompensa} pts` : ''}`,
        tag: `conquista-${conquista.id}`,
        url: '/operacional/conquistas',
      }).catch(() => {})
    }
  }
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [os] = await db
    .select()
    .from(ordensServico)
    .where(and(eq(ordensServico.id, params.id), eq(ordensServico.lojaId, session.user.lojaId!)))
    .limit(1)

  if (!os) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })

  const itens = await db.select({
    id: itensOs.id,
    tipo: itensOs.tipo,
    descricao: itensOs.descricao,
    quantidade: itensOs.quantidade,
    precoUnitario: itensOs.precoUnitario,
    total: itensOs.total,
    servicoNome: servicos.nome,
  })
    .from(itensOs)
    .leftJoin(servicos, eq(itensOs.servicoId, servicos.id))
    .where(eq(itensOs.osId, params.id))

  const [cliente] = await db.select({ nome: usuarios.nome, telefone: usuarios.telefone, email: usuarios.email })
    .from(usuarios).where(eq(usuarios.id, os.clienteId)).limit(1)

  const veiculo = os.veiculoId
    ? await db.select().from(veiculos).where(eq(veiculos.id, os.veiculoId)).limit(1).then(r => r[0])
    : null

  return NextResponse.json({ ...os, itens, cliente, veiculo })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.lojaId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const lojaId = session.user.lojaId

  const body = await req.json()
  const { status, itens, ...rest } = body

  const now = new Date()
  const timestamps: Record<string, Date | null> = {}
  if (status === 'em_execucao') timestamps.iniciadoEm = now
  if (status === 'concluida') timestamps.concluidoEm = now
  if (status === 'entregue') timestamps.entregueEm = now

  const [updated] = await db
    .update(ordensServico)
    .set({ ...rest, ...(status ? { status } : {}), ...timestamps, atualizadoEm: now })
    .where(and(eq(ordensServico.id, params.id), eq(ordensServico.lojaId, lojaId)))
    .returning()

  // Se conclusão: debitar estoque e conceder XP ao operador
  if (status === 'concluida' && updated.operadorId) {
    // Busca itens de produto não debitados
    const itensProd = await db.select()
      .from(itensOs)
      .where(and(eq(itensOs.osId, params.id), eq(itensOs.tipo, 'produto'), eq(itensOs.estoqueDebitado, false)))

    for (const item of itensProd) {
      if (!item.produtoId) continue
      await db.update(estoque)
        .set({ quantidade: sql`${estoque.quantidade} - ${item.quantidade}`, atualizadoEm: now })
        .where(and(eq(estoque.produtoId, item.produtoId), eq(estoque.lojaId, lojaId)))
      await db.insert(movimentacoesEstoque).values({
        lojaId, produtoId: item.produtoId, operadorId: updated.operadorId,
        tipo: 'uso_os', quantidade: item.quantidade as any,
        referenciaId: params.id, referenciaTipo: 'os',
      })
      await db.update(itensOs).set({ estoqueDebitado: true }).where(eq(itensOs.id, item.id))
    }

    const XP_OS = 50

    // XP: cria registro se não existir, depois incrementa
    await db.insert(xpOperador).values({
      lojaId, operadorId: updated.operadorId,
      pontosAtuais: XP_OS, totalHistorico: XP_OS,
      nivel: 1, ultimaAtividadeEm: now,
    }).onConflictDoUpdate({
      target: [xpOperador.lojaId, xpOperador.operadorId],
      set: {
        pontosAtuais:     sql`${xpOperador.pontosAtuais} + ${XP_OS}`,
        totalHistorico:   sql`${xpOperador.totalHistorico} + ${XP_OS}`,
        ultimaAtividadeEm: now,
        atualizadoEm:     now,
      },
    })

    await db.insert(eventosXp).values({
      lojaId, operadorId: updated.operadorId,
      tipo: 'os_concluida', pontos: XP_OS,
      descricao: `OS #${updated.numero} concluída`,
      referenciaId: params.id,
    })

    // Conquistas automáticas
    const [{ total: totalOs }] = await db
      .select({ total: count() })
      .from(ordensServico)
      .where(and(
        eq(ordensServico.operadorId, updated.operadorId),
        eq(ordensServico.status, 'concluida'),
      ))
    await verificarEConcederConquistas(
      lojaId,
      updated.operadorId,
      totalOs,
      !!(rest.assinaturaClienteUrl || updated.assinaturaClienteUrl),
    )

    // Comissões automáticas
    const configs = await db.select().from(configComissoes)
      .where(and(
        eq(configComissoes.lojaId, lojaId),
        eq(configComissoes.operadorId, updated.operadorId),
        eq(configComissoes.ativo, true),
      ))

    for (const cfg of configs) {
      let valorComissao = 0
      const totalOs = parseFloat(updated.totalGeral ?? '0')

      if (cfg.tipo === 'fixo_por_os') {
        valorComissao = parseFloat(cfg.valorFixo ?? '0')
      } else if (cfg.tipo === 'percentual_receita') {
        valorComissao = totalOs * (parseFloat(cfg.percentual ?? '0') / 100)
      }

      if (valorComissao > 0) {
        await db.insert(comissoes).values({
          lojaId, operadorId: updated.operadorId,
          referenciaId: params.id, referenciaTipo: 'os',
          valor: valorComissao.toFixed(2),
          status: 'pendente',
        })
      }
    }
  }

  return NextResponse.json(updated)
}
