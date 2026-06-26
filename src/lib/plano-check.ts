import { db } from '@/db'
import { lojas, planos, agendamentos, usuarios } from '@/db/schema'
import { eq, and, gte, lte, count } from 'drizzle-orm'

export interface PlanoLimiteResult {
  permitido: boolean
  motivo?: string
}

/** Verifica se a loja pode criar um novo agendamento (limite mensal do plano) */
export async function verificarLimiteAgendamento(lojaId: string): Promise<PlanoLimiteResult> {
  // Busca loja + plano
  const [loja] = await db
    .select({
      status: lojas.status,
      trialExpiraEm: lojas.trialExpiraEm,
      planoLimite: planos.limiteAgendamentosMes,
    })
    .from(lojas)
    .leftJoin(planos, eq(lojas.planoId, planos.id))
    .where(eq(lojas.id, lojaId))
    .limit(1)

  if (!loja) return { permitido: false, motivo: 'Loja não encontrada' }

  // Loja suspensa ou inativa
  if (loja.status === 'suspensa') {
    return { permitido: false, motivo: 'Loja suspensa. Entre em contato com o suporte.' }
  }
  if (loja.status === 'inativa') {
    return { permitido: false, motivo: 'Loja inativa.' }
  }

  // Trial expirado
  if (loja.status === 'trial' && loja.trialExpiraEm) {
    if (new Date() > new Date(loja.trialExpiraEm)) {
      return { permitido: false, motivo: 'Período de trial expirado. Assine um plano para continuar.' }
    }
  }

  // Sem plano = usa limite padrão (trial = 50)
  const limite = loja.planoLimite ?? 50

  // Conta agendamentos do mês atual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59)

  const [{ total }] = await db
    .select({ total: count() })
    .from(agendamentos)
    .where(and(
      eq(agendamentos.lojaId, lojaId),
      gte(agendamentos.dataHoraInicio, inicioMes),
      lte(agendamentos.dataHoraInicio, fimMes),
    ))

  if (total >= limite) {
    return {
      permitido: false,
      motivo: `Limite de ${limite} agendamentos/mês atingido. Faça upgrade do plano.`,
    }
  }

  return { permitido: true }
}

/** Verifica se a loja pode adicionar mais operadores */
export async function verificarLimiteOperadores(lojaId: string): Promise<PlanoLimiteResult> {
  const [loja] = await db
    .select({ planoLimite: planos.limiteOperadores })
    .from(lojas)
    .leftJoin(planos, eq(lojas.planoId, planos.id))
    .where(eq(lojas.id, lojaId))
    .limit(1)

  const limite = loja?.planoLimite ?? 2

  const [{ total }] = await db
    .select({ total: count() })
    .from(usuarios)
    .where(and(
      eq(usuarios.lojaId, lojaId),
      eq(usuarios.role, 'operador'),
      eq(usuarios.ativo, true),
    ))

  if (total >= limite) {
    return {
      permitido: false,
      motivo: `Limite de ${limite} operadores do seu plano atingido.`,
    }
  }
  return { permitido: true }
}
