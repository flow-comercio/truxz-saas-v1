import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deepseekChat } from '@/lib/deepseek'
import { checkRateLimit, sanitizeHistorico } from '@/lib/rate-limit'
import { db } from '@/db'
import { lojas, servicos, agendamentos, veiculos } from '@/db/schema'
import { eq, and, gte } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: 'IA não configurada' }, { status: 503 })

  const clienteId = session.user.id
  const lojaId = session.user.lojaId!
  if (!checkRateLimit(`ai:atendimento:${clienteId}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const { mensagem, historico: rawHistorico = [] } = await req.json()
  if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0 || mensagem.length > 800) {
    return NextResponse.json({ error: 'Mensagem inválida ou muito longa.' }, { status: 400 })
  }
  const historico = sanitizeHistorico(rawHistorico)

  const agora = new Date()

  const [
    [loja],
    servicosLoja,
    proxAgendamentos,
    meusVeiculos,
  ] = await Promise.all([
    db.select({ nome: lojas.nome, configuracoes: lojas.configuracoes })
      .from(lojas).where(eq(lojas.id, lojaId)).limit(1),
    db.select({ nome: servicos.nome, preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos })
      .from(servicos).where(and(eq(servicos.lojaId, lojaId), eq(servicos.ativo, true))).limit(20),
    db.select({ dataHoraInicio: agendamentos.dataHoraInicio, status: agendamentos.status })
      .from(agendamentos)
      .where(and(eq(agendamentos.clienteId, clienteId), eq(agendamentos.lojaId, lojaId), gte(agendamentos.dataHoraInicio, agora)))
      .orderBy(agendamentos.dataHoraInicio).limit(3),
    db.select({ placa: veiculos.placa, modelo: veiculos.modelo, marca: veiculos.marca })
      .from(veiculos).where(and(eq(veiculos.clienteId, clienteId), eq(veiculos.lojaId, lojaId))).limit(5),
  ])

  const nomeCliente = session.user.name?.split(' ')[0] ?? 'cliente'
  const config = loja?.configuracoes as any

  const system = `Você é o assistente virtual da ${loja?.nome ?? 'estética automotiva'}. Atenda ${nomeCliente} com simpatia e objetividade. Responda em português brasileiro.

SERVIÇOS: ${servicosLoja.map(s => `${s.nome} R$${s.preco} (${s.duracaoMinutos}min)`).join(' | ')}
VEÍCULOS DO CLIENTE: ${meusVeiculos.map(v => `${v.marca ?? ''} ${v.modelo ?? ''} ${v.placa}`).join(', ') || 'nenhum'}
PRÓXIMOS AGENDAMENTOS: ${proxAgendamentos.length > 0 ? proxAgendamentos.map(a => new Date(a.dataHoraInicio!).toLocaleString('pt-BR') + ' - ' + a.status).join(', ') : 'nenhum'}
HORÁRIO: ${config?.horarioAbertura ?? '08:00'} às ${config?.horarioFechamento ?? '18:00'}

Para agendar, diga que o cliente pode usar o botão "Novo Agendamento" no app. Máximo 3 frases por resposta.`

  const messages = [
    ...historico.slice(-8),
    { role: 'user' as const, content: mensagem },
  ]

  try {
    const resposta = await deepseekChat({ system, messages, maxTokens: 300, model: 'deepseek-chat' })
    return NextResponse.json({ resposta, role: 'assistant' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
