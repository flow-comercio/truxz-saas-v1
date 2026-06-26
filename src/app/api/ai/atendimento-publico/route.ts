import { NextRequest, NextResponse } from 'next/server'
import { deepseekChat } from '@/lib/deepseek'
import { checkRateLimit, sanitizeHistorico } from '@/lib/rate-limit'
import { db } from '@/db'
import { lojas, servicos } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'IA não configurada' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  if (!checkRateLimit(`ai:pub:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { slug, mensagem, historico: rawHistorico = [] } = await req.json()
  if (!slug || !mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0 || mensagem.length > 500) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }
  const historico = sanitizeHistorico(rawHistorico)

  const [loja] = await db
    .select({ id: lojas.id, nome: lojas.nome, telefone: lojas.telefone, configuracoes: lojas.configuracoes })
    .from(lojas)
    .where(and(eq(lojas.slug, slug), eq(lojas.status, 'ativa')))
    .limit(1)

  if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const servicosLoja = await db
    .select({ nome: servicos.nome, preco: servicos.preco, duracaoMinutos: servicos.duracaoMinutos, descricao: servicos.descricao })
    .from(servicos)
    .where(and(eq(servicos.lojaId, loja.id), eq(servicos.ativo, true)))
    .limit(20)

  const cfg = loja.configuracoes as any
  const listaServicos = servicosLoja
    .map(s => `• ${s.nome}: R$${parseFloat(s.preco).toFixed(2)} (${s.duracaoMinutos}min)${s.descricao ? ' - ' + s.descricao : ''}`)
    .join('\n')

  const system = `Você é o assistente de vendas da ${loja.nome}, estética automotiva. Seu único objetivo é CONVERTER visitantes em clientes agendados.

SERVIÇOS E PREÇOS:
${listaServicos || 'Consulte os serviços no site'}

HORÁRIO: ${cfg?.horarioAbertura ?? '08:00'} às ${cfg?.horarioFechamento ?? '18:00'}, ${cfg?.diasFuncionamento ?? 'Segunda a Sábado'}
TELEFONE: ${loja.telefone ?? 'consulte no site'}

REGRAS DE OURO:
1. Seja simpático, breve e objetivo (máx. 2 frases por resposta)
2. Após qualquer resposta, SEMPRE convide para agendar
3. Se perguntarem preço: dê o preço E já chame para agendar
4. Se perguntarem disponibilidade: diga que tem vagas e chame para agendar
5. Nunca diga "não sei" — sugira agendar para confirmar pessoalmente
6. Use emojis com moderação (1 por resposta no máximo)
7. Sempre termine com uma CTA clara: "Posso te ajudar a agendar agora!" ou "Clica no botão Agendar e garante sua vaga!"

VOCÊ NUNCA DEVE: inventar preços, prometer algo que não está nos serviços, ou falar mal de concorrentes.`

  const messages = [
    ...historico.slice(-10),
    { role: 'user' as const, content: mensagem },
  ]

  try {
    const resposta = await deepseekChat({ system, messages, maxTokens: 250, model: 'deepseek-chat' })
    return NextResponse.json({ resposta })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
