import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { lojas, assinaturas, agendamentos, pagamentos } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { Store, DollarSign, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default async function MasterDashboard() {
  const [totalLojas, lojasAtivas, receitaTotal, totalAgendamentos] = await Promise.all([
    db.select({ count: count() }).from(lojas),
    db.select({ count: count() }).from(lojas).where(eq(lojas.status, 'ativa')),
    db.select({ total: sql<string>`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos).where(eq(pagamentos.status, 'pago')),
    db.select({ count: count() }).from(agendamentos),
  ])

  const stats = [
    { label: 'Total de Lojas', value: totalLojas[0].count, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lojas Ativas', value: lojasAtivas[0].count, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Receita Total', value: formatCurrency(parseFloat(receitaTotal[0]?.total || '0')), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Agendamentos', value: totalAgendamentos[0].count, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Painel Master</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma</p>
      </div>

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

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Gerenciar Lojas', href: '/master/lojas', icon: Store },
            { label: 'Ver Financeiro', href: '/master/financeiro', icon: DollarSign },
            { label: 'Planos SaaS', href: '/master/planos', icon: TrendingUp },
            { label: 'Nova Loja', href: '/master/lojas/nova', icon: Users },
          ].map(a => {
            const Icon = a.icon
            return (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
