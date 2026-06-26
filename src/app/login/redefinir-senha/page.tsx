'use client'
import { useState, Suspense } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, Flag, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function RacingBg() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(220,0,0,0.06) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['-20', '10', '40', '70', '100'].map((left, i) => (
          <div key={i} className="absolute top-0 bottom-0 opacity-[0.025]"
            style={{ left: `${left}%`, width: '1px', background: 'linear-gradient(180deg, transparent, #DC0000 50%, transparent)', transform: 'skewX(-15deg)' }} />
        ))}
      </div>
      <div className="absolute top-0 left-0 w-40 h-40 opacity-[0.04] pointer-events-none checkers-stripe" />
      <div className="absolute bottom-0 right-0 w-56 h-28 opacity-[0.04] pointer-events-none checkers-stripe" />
      <div className="absolute top-0 left-0 right-0 h-1 checkers-stripe opacity-50 pointer-events-none" />
      <div className="absolute top-1 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #DC0000 30%, #FF8700 70%, transparent)' }} />
    </>
  )
}

function RedefinirForm() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token') ?? ''

  const [form, setForm]       = useState({ novaSenha: '', confirmarSenha: '' })
  const [showSenha, setShow]  = useState(false)
  const [concluido, setConcluido] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro ao redefinir senha')
        return json
      }),
    onSuccess: () => {
      setConcluido(true)
      setTimeout(() => router.push('/login'), 3000)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const senhasIguais = form.novaSenha === form.confirmarSenha
  const formValido   = form.novaSenha.length >= 6 && senhasIguais

  /* Token ausente */
  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <AlertCircle className="w-6 h-6" style={{ color: '#F87171' }} />
        </div>
        <p className="font-bold font-racing text-sm mb-1" style={{ color: '#F87171' }}>Link inválido ou expirado</p>
        <Link href="/login/recuperar-senha"
          className="text-xs font-racing font-bold mt-2 inline-block"
          style={{ color: '#DC0000' }}>
          Solicitar novo link →
        </Link>
      </div>
    )
  }

  /* Senha redefinida */
  if (concluido) {
    return (
      <div className="text-center py-3">
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="absolute w-20 h-20 rounded-full opacity-15 animate-ping"
            style={{ background: 'rgba(74,222,128,0.4)', animationDuration: '2s' }} />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.35)' }}>
            <span className="text-3xl">🏁</span>
          </div>
        </div>
        <p className="text-[10px] font-bold font-racing uppercase tracking-[3px] mb-1" style={{ color: '#4ADE80' }}>
          Nova senha ativa!
        </p>
        <h2 className="font-black text-white font-display tracking-wider text-xl mb-2">Acesso Liberado</h2>
        <p className="text-sm font-racing" style={{ color: '#A0A0B8' }}>
          Redirecionando para o cockpit...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(220,0,0,0.1)', border: '1px solid rgba(220,0,0,0.25)' }}>
          <Lock className="w-5 h-5" style={{ color: '#DC0000' }} />
        </div>
        <div>
          <h2 className="font-bold text-white font-display tracking-wider">Nova Credencial</h2>
          <p className="text-xs mt-0.5 font-racing" style={{ color: '#55556A' }}>
            Mínimo 6 caracteres.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing"
            style={{ color: '#55556A' }}>Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#3A3A4A' }} />
            <input
              type={showSenha ? 'text' : 'password'}
              className="input-racing pl-10 pr-10"
              placeholder="••••••••"
              value={form.novaSenha}
              onChange={e => setForm(f => ({ ...f, novaSenha: e.target.value }))}
              autoFocus
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#55556A' }}>
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing"
            style={{ color: '#55556A' }}>Confirmar nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#3A3A4A' }} />
            <input
              type={showSenha ? 'text' : 'password'}
              className="input-racing pl-10"
              placeholder="••••••••"
              value={form.confirmarSenha}
              onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
            />
          </div>
          {form.confirmarSenha && !senhasIguais && (
            <p className="text-[10px] mt-1 font-racing font-bold" style={{ color: '#F87171' }}>
              ⚠ As senhas não conferem
            </p>
          )}
          {form.confirmarSenha && senhasIguais && form.novaSenha.length >= 6 && (
            <p className="text-[10px] mt-1 font-racing font-bold" style={{ color: '#4ADE80' }}>
              ✓ Senhas conferem
            </p>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!formValido || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold font-racing text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #DC0000, #A00000)',
            boxShadow: formValido && !mutation.isPending ? '0 0 22px rgba(220,0,0,0.35)' : 'none',
          }}>
          {mutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            : <><Flag className="w-4 h-4" /> Redefinir e Entrar</>}
        </button>
      </div>
    </>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0A0A0F' }}>
      <RacingBg />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo compacto */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #DC0000, #A00000)', boxShadow: '0 0 18px rgba(220,0,0,0.4)' }}>
              <img src="/logo-truxz.png" alt="TRUXZ" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-2xl font-black text-white font-display tracking-[0.18em]">TRUXZ</span>
          </div>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(24px)', border: '1px solid rgba(220,0,0,0.18)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #DC0000 40%, #FF8700 60%, transparent)' }} />
          <div className="absolute top-0 left-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(220,0,0,0.3), transparent)' }} />

          <div className="p-6">
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#DC0000' }} />
              </div>
            }>
              <RedefinirForm />
            </Suspense>

            <Link href="/login"
              className="flex items-center justify-center gap-2 mt-6 text-sm font-semibold font-racing transition-all"
              style={{ color: '#2A2A3A' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#FF8700'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#2A2A3A'}>
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Cockpit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
