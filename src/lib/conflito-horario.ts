import { db } from '@/db'
import { agendamentos } from '@/db/schema'
import { eq, and, not, or, lte, gte } from 'drizzle-orm'

/**
 * Verifica se há conflito de horário para um operador ou no slot geral.
 * Retorna true se o horário está DISPONÍVEL.
 */
export async function verificarDisponibilidade({
  lojaId,
  dataHoraInicio,
  dataHoraFim,
  operadorId,
  excluirAgendamentoId,
}: {
  lojaId: string
  dataHoraInicio: Date
  dataHoraFim: Date
  operadorId?: string
  excluirAgendamentoId?: string
}): Promise<{ disponivel: boolean; motivo?: string }> {

  // Busca conflitos: agendamentos que se sobrepõem ao slot pedido
  // Sobreposição: inicio < fimNovo E fim > inicioNovo
  const conditions = [
    eq(agendamentos.lojaId, lojaId),
    not(eq(agendamentos.status, 'cancelado')),
    not(eq(agendamentos.status, 'no_show')),
    lte(agendamentos.dataHoraInicio, dataHoraFim),
    gte(agendamentos.dataHoraFim,    dataHoraInicio),
  ]

  if (operadorId) {
    conditions.push(eq(agendamentos.operadorId, operadorId))
  }
  if (excluirAgendamentoId) {
    conditions.push(not(eq(agendamentos.id, excluirAgendamentoId)))
  }

  const conflitos = await db
    .select({ id: agendamentos.id })
    .from(agendamentos)
    .where(and(...conditions))
    .limit(1)

  if (conflitos.length > 0) {
    return {
      disponivel: false,
      motivo: operadorId
        ? 'Operador já possui agendamento neste horário.'
        : 'Já existe um agendamento neste horário.',
    }
  }

  return { disponivel: true }
}

/**
 * Retorna os horários disponíveis de um dia, respeitando o intervalo do plano.
 */
export async function horariosDoDia({
  lojaId,
  data,
  duracaoMinutos,
  intervaloMinutos = 60,
  horarioAbertura = '08:00',
  horarioFechamento = '18:00',
}: {
  lojaId: string
  data: string           // "2024-11-20"
  duracaoMinutos: number
  intervaloMinutos?: number
  horarioAbertura?: string
  horarioFechamento?: string
}): Promise<{ hora: string; disponivel: boolean }[]> {

  const [hA, mA] = horarioAbertura.split(':').map(Number)
  const [hF, mF] = horarioFechamento.split(':').map(Number)
  const aberturaMin = hA * 60 + mA
  const fechamentoMin = hF * 60 + mF

  const slots: { hora: string; disponivel: boolean }[] = []

  for (let min = aberturaMin; min + duracaoMinutos <= fechamentoMin; min += intervaloMinutos) {
    const h = String(Math.floor(min / 60)).padStart(2, '0')
    const m = String(min % 60).padStart(2, '0')
    const hora = `${h}:${m}`

    const inicio = new Date(`${data}T${hora}:00`)
    const fim    = new Date(inicio.getTime() + duracaoMinutos * 60_000)

    const { disponivel } = await verificarDisponibilidade({ lojaId, dataHoraInicio: inicio, dataHoraFim: fim })
    slots.push({ hora, disponivel })
  }

  return slots
}
