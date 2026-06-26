import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, servicos, lojas } from '@/db/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import Link from 'next/link'
import { Car, CalendarDays, Wrench, ChevronRight, Clock, Star } from 'lucide-react'
import { formatCurrency, formatDateTime, getInitials, minutesToHours } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { label: string; variant: 'amber' | 'purple' | 'green' | 'red' | 'neutral' }> = {
  pendente:     { label: 'Na Fila',    variant: 'amber' },
  confirmado:   { label: 'Confirmado', variant: 'purple' },
  em_andamento: { label: 'Em Serviço', variant: 'purple' },
  concluido:    { label: 'Concluído',  variant: 'green' },
  cancelado:    { label: 'Cancelado',  variant: 'red' },
}

export default async function ClienteHome() {
  const session = await getServerSession(authOptions)
  const clienteId = session!.user.id
  const lojaId    = session!.user.lojaId!
  const agora     = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [proximosAgs, loja, servicosLista, totalMesRes] = await Promise.all([
    db.select({
      id:              agendamentos.id,
      dataHoraInicio:  agendamentos.dataHoraInicio,
      status:          agendamentos.status,
      precoTotal:      agendamentos.precoTotal,
      servicoNome:     servicos.nome,
      servicoDuracao:  servicos.duracaoMinutos,
    })
      .from(agendamentos)
      .innerJoin(servicos, eq(agendamentos.servicoId, servicos.id))
      .where(and(
        eq(agendamentos.clienteId, clienteId),
        eq(agendamentos.lojaId, lojaId),
        gte(agendamentos.dataHoraInicio, agora),
      ))
      .orderBy(agendamentos.dataHoraInicio)
      .limit(4),

    db.select({ nome: lojas.nome }).from(lojas).where(eq(lojas.id, lojaId)).limit(1),

    db.select({
      id:             servicos.id,
      nome:           servicos.nome,
      preco:          servicos.preco,
      duracaoMinutos: servicos.duracaoMinutos,
    })
      .from(servicos)
      .where(and(eq(servicos.lojaId, lojaId), eq(servicos.ativo, true)))
      .limit(8),

    db.select({ total: count() })
      .from(agendamentos)
      .where(and(
        eq(agendamentos.clienteId, clienteId),
        eq(agendamentos.lojaId, lojaId),
        gte(agendamentos.dataHoraInicio, inicioMes),
      )),
  ])

  const nomeLoja      = loja[0]?.nome ?? 'TRUXZ'
  const nomeUsuario   = session!.user.name.split(' ')[0]
  const totalMes      = totalMesRes[0]?.total ?? 0
  const proximoAg     = proximosAgs[0]
  const outrosAgs     = proximosAgs.slice(1)

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-12 pb-6 safe-top"
        style={{ background: 'linear-gradient(180deg, rgba(157,78,221,0.12) 0%, transparent 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="section-tag mb-2">{nomeLoja}</p>
            <h1 className="text-2xl font-black text-white">
              Olá, <span className="text-gradient">{nomeUsuario}</span> 👋
            </h1>
            <p className="text-sm text-white/35 mt-1">
              {totalMes > 0 ? `${totalMes} serviço${totalMes > 1 ? 's' : ''} este mês` : 'Bem-vindo ao seu painel'}
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-[18px] flex items-center justify-center font-black text-white text-xl"
              style={{ background: 'linear-gradient(135deg, #9D4EDD, #FF375F)', boxShadow: '0 0 30px rgba(157,78,221,0.4)' }}>
              {getInitials(session!.user.name)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#34C759]"
              style={{ border: '2px solid #080612' }} />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── PRÓXIMO SERVIÇO ────────────────────────────────────────── */}
        {proximoAg ? (
          <Link href={`/cliente/agendamento/${proximoAg.id}`}>
            <div className="card p-4 active:scale-[0.99]">
              <div className="flex items-center justify-between mb-3">
                <span className="section-tag">Próximo serviço</span>
                <Badge variant={STATUS_MAP[proximoAg.status ?? 'pendente']?.variant ?? 'neutral'} dot>
                  {STATUS_MAP[proximoAg.status ?? 'pendente']?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
                  <Wrench className="w-6 h-6 text-[#9D4EDD]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate">{proximoAg.servicoNome}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatDateTime(proximoAg.dataHoraInicio)}
                    {proximoAg.servicoDuracao
                      ? ` · ${minutesToHours(proximoAg.servicoDuracao)}`
                      : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-[#C77DFF] text-sm">
                    {formatCurrency(parseFloat(proximoAg.precoTotal))}
                  </p>
                  <ChevronRight className="w-4 h-4 text-white/20 ml-auto mt-1" />
                </div>
              </div>
              {proximoAg.status === 'em_andamento' && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Em execução</span>
                    <span className="text-[10px] font-bold text-[#9D4EDD]">60%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/cliente/agendar">
            <div className="card p-5 flex items-center gap-4 active:scale-[0.99]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)' }}>
                <CalendarDays className="w-6 h-6 text-[#9D4EDD]" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white">Agendar Serviço</p>
                <p className="text-xs text-white/40 mt-0.5">Escolha data e horário</p>
              </div>
              <div className="btn-primary px-3 py-2 text-xs">Agendar</div>
            </div>
          </Link>
        )}

        {/* ── ATALHOS RÁPIDOS ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Meu Carro',  href: '/cliente/veiculos',  Icon: Car,          color: '#3F8EFF' },
            { label: 'Histórico',  href: '/cliente/historico', Icon: Clock,        color: '#9D4EDD' },
            { label: 'Agendar',    href: '/cliente/agendar',   Icon: CalendarDays, color: '#34C759' },
          ].map(({ label, href, Icon, color }) => (
            <Link key={href} href={href}>
              <div className="card p-3 flex flex-col items-center gap-2 text-center active:scale-95">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wide text-white/40">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── SERVIÇOS DISPONÍVEIS (scroll horizontal) ───────────────── */}
        {servicosLista.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-white text-sm">Serviços</h2>
              <Link href="/cliente/agendar" className="text-xs font-bold text-[#9D4EDD]">
                Ver todos →
              </Link>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scroll-touch"
              style={{ scrollbarWidth: 'none' }}>
              {servicosLista.map(srv => (
                <Link key={srv.id} href="/cliente/agendar" className="flex-shrink-0 w-36">
                  <div className="card p-3 h-full flex flex-col gap-2 active:scale-[0.97]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(157,78,221,0.15)' }}>
                      <Star className="w-4 h-4 text-[#9D4EDD]" />
                    </div>
                    <p className="font-black text-white text-sm leading-tight line-clamp-2 flex-1">
                      {srv.nome}
                    </p>
                    <div>
                      <p className="text-sm font-black text-[#C77DFF]">
                        {formatCurrency(parseFloat(srv.preco))}
                      </p>
                      {srv.duracaoMinutos && (
                        <p className="text-[10px] text-white/25 mt-0.5">
                          {minutesToHours(srv.duracaoMinutos)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── OUTROS AGENDAMENTOS ────────────────────────────────────── */}
        {outrosAgs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-white text-sm">Próximos</h2>
              <Link href="/cliente/historico" className="text-xs font-bold text-[#9D4EDD]">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2">
              {outrosAgs.map(ag => {
                const s = STATUS_MAP[ag.status ?? 'pendente']
                return (
                  <Link key={ag.id} href={`/cliente/agendamento/${ag.id}`}>
                    <div className="card p-4 flex items-center gap-3 active:scale-[0.99]">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(63,142,255,0.1)' }}>
                        <Wrench className="w-4 h-4 text-[#3F8EFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{ag.servicoNome}</p>
                        <p className="text-xs text-white/35 mt-0.5">{formatDateTime(ag.dataHoraInicio)}</p>
                      </div>
                      <Badge variant={s?.variant ?? 'neutral'}>{s?.label}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
