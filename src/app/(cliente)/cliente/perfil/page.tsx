'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, LogOut, Loader2, Shield, ChevronRight, Star, CheckCircle, TrendingUp } from 'lucide-react'
import { getInitials, formatCurrency } from '@/lib/utils'

export default function PerfilPage() {
  const { data: session } = useSession()
  const [showSenha, setShowSenha] = useState(false)
  const [senhaForm, setSenhaForm] = useState({ atual: '', nova: '', confirmar: '' })

  const { data: stats } = useQuery<any>({
    queryKey: ['gamificacao-perfil'],
    queryFn:  () => fetch('/api/gamificacao/meu-dashboard').then(r => r.json()),
    staleTime: 60000,
  })

  const trocaSenha = useMutation({
    mutationFn: (data: typeof senhaForm) =>
      fetch('/api/perfil/senha', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Erro'); return j }),
    onSuccess: () => {
      toast.success('Senha alterada!')
      setShowSenha(false)
      setSenhaForm({ atual: '', nova: '', confirmar: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const nome  = session?.user.name  ?? ''
  const email = session?.user.email ?? ''
  const nivel = stats?.nivel ?? 1
  const xp    = stats?.totalXp ?? 0
  const xpNivel = xp % 500
  const xpPct   = Math.round((xpNivel / 500) * 100)

  return (
    <div className="min-h-screen pb-28">

      {/* ── HERO ────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10 text-center safe-top"
        style={{ background: 'linear-gradient(180deg, rgba(157,78,221,0.18) 0%, transparent 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 60%, rgba(157,78,221,0.12) 0%, transparent 70%)' }} />

        {/* Avatar */}
        <div className="relative inline-flex mb-4">
          <div className="w-24 h-24 rounded-[28px] flex items-center justify-center text-white text-3xl font-black"
            style={{
              background: 'linear-gradient(135deg, #9D4EDD, #FF375F)',
              boxShadow: '0 0 50px rgba(157,78,221,0.5)',
            }}>
            {getInitials(nome)}
          </div>
          {/* Badge nível */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', border: '2px solid #0A0A0F' }}>
            {nivel}
          </div>
        </div>

        <h1 className="text-xl font-black text-white mt-2">{nome}</h1>
        <p className="text-sm text-[#9D4EDD] mt-0.5">{email}</p>

        {/* XP Bar */}
        <div className="mt-4 max-w-[200px] mx-auto">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-bold text-white/30">Nível {nivel}</span>
            <span className="text-[10px] font-bold text-[#C77DFF]">{xpNivel}/500 XP</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 -mt-2">

        {/* ── STATS ───────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Serviços', value: stats.totalAgendamentos ?? 0, Icon: CheckCircle, color: '#34C759' },
              { label: 'Receita',  value: formatCurrency(stats.receitaTotal ?? 0), Icon: TrendingUp, color: '#3F8EFF', small: true },
              { label: 'XP Total', value: xp,                           Icon: Star,        color: '#FF9F0A' },
            ].map(({ label, value, Icon, color, small }) => (
              <div key={label} className="card p-3 flex flex-col gap-1.5 items-center text-center">
                <Icon className="w-4 h-4" style={{ color }} />
                <p className={`font-black text-white ${small ? 'text-xs' : 'text-xl'} leading-tight`}>{value}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── ALTERAR SENHA ───────────────────────────── */}
        <div className="card overflow-hidden">
          <button onClick={() => setShowSenha(!showSenha)}
            className="w-full flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.2)' }}>
              <Lock className="w-4 h-4 text-[#9D4EDD]" />
            </div>
            <span className="flex-1 text-sm font-bold text-white text-left">Alterar senha</span>
            <ChevronRight className="w-4 h-4 text-white/20 transition-transform"
              style={{ transform: showSenha ? 'rotate(90deg)' : 'none' }} />
          </button>

          {showSenha && (
            <div className="px-4 pb-4 space-y-3"
              style={{ borderTop: '1px solid rgba(157,78,221,0.1)' }}>
              <input type="password" className="input mt-3" placeholder="Senha atual"
                value={senhaForm.atual}
                onChange={e => setSenhaForm(f => ({ ...f, atual: e.target.value }))} />
              <input type="password" className="input" placeholder="Nova senha"
                value={senhaForm.nova}
                onChange={e => setSenhaForm(f => ({ ...f, nova: e.target.value }))} />
              <input type="password" className="input" placeholder="Confirmar nova senha"
                value={senhaForm.confirmar}
                onChange={e => setSenhaForm(f => ({ ...f, confirmar: e.target.value }))} />
              <button
                onClick={() => trocaSenha.mutate(senhaForm)}
                disabled={!senhaForm.atual || !senhaForm.nova || senhaForm.nova !== senhaForm.confirmar || trocaSenha.isPending}
                className="btn-primary w-full">
                {trocaSenha.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                  : <><Shield className="w-4 h-4" /> Salvar Senha</>}
              </button>
            </div>
          )}
        </div>

        {/* ── SAIR ────────────────────────────────────── */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.99]"
          style={{ background: 'rgba(255,55,95,0.06)', border: '1px solid rgba(255,55,95,0.2)', color: '#FF375F' }}>
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>

        <p className="text-center text-[10px] text-white/10 uppercase tracking-widest pb-2">
          TRUXZ · v3.0
        </p>
      </div>
    </div>
  )
}
