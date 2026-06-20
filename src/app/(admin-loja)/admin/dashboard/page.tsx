import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { agendamentos, pagamentos, usuarios, servicos } from '@/db/schema'
import { eq, and, gte, count, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import {
  CalendarDays, DollarSign, Users, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Star
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const lojaId = session!.user.lojaId!

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date()
  fimHoje.setHours(23, 59, 59, 999)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  // Queries em paralelo
  const [
    agendamentosHoje,
    receitaMes,
    clientesTotal,
    agendamentosStatus,
  ] = await Promise.all([
    db.select({ count: count() })
      .from(agendamentos)
      .where(and(
        eq(agendamentos.lojaId, lojaId),
        gte(agendamentos.dataHoraInicio, hoje)
      )),

    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(and(
        eq(pagamentos.lojaId, lojaId),
        eq(pagamentos.status, 'pago'),
        gte(pagamentos.pagoEm, inicioMes)
      )),

    db.select({ count: count() })
      .from(usuarios)
      .where(and(
        eq(usuarios.lojaId, lojaId),
        eq(usuarios.role, 'cliente')
      )),

    db.select({ status: agendamentos.status, count: count() })
      .from(agendamentos)
      .where(and(
        eq(agendamentos.lojaId, lojaId),
        gte(agendamentos.dataHoraInicio, hoje)
      ))
      .groupBy(agendamentos.status),
  ])

  const agHoje = agendamentosHoje[0].count
  const receita = parseFloat(receitaMes[0]?.total || '0')
  const clientes = clientesTotal[0].count

  const statusMap = Object.fromEntries(agendamentosStatus.map(s => [s.status, s.count]))
  const pendentes = statusMap['pendente'] || 0
  const emAndamento = statusMap['em_andamento'] || 0
  const concluidos = statusMap['concluido'] || 0

  const stats = [
    { label: 'Agendamentos Hoje', value: agHoje, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Receita do Mês', value: formatCurrency(receita), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Clientes Cadastrados', value: clientes, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Concluídos Hoje', value: concluidos, icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/admin/agendamentos/novo" className="btn-primary text-xs px-3 py-2">
          + Novo Agendamento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Status do dia */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Status do Dia</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-600">{pendentes}</p>
            <p className="text-xs text-amber-700 font-medium mt-1">Pendentes</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{emAndamento}</p>
            <p className="text-xs text-blue-700 font-medium mt-1">Em Andamento</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{concluidos}</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">Concluídos</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Ver Agendamentos', href: '/admin/agendamentos', icon: CalendarDays },
            { label: 'Gerenciar Serviços', href: '/admin/servicos', icon: TrendingUp },
            { label: 'Relatório Financeiro', href: '/admin/financeiro', icon: DollarSign },
            { label: 'Gerenciar Equipe', href: '/admin/equipe', icon: Users },
          ].map(action => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:bg-orange-50 hover:border-orange-200 transition-colors group"
              >
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
