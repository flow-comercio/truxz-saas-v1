'use client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Mail, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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

function VerificarEmailContent() {
  const params      = useSearchParams()
  const email       = params.get('email') ?? ''
  const [reenviando, setReenviando] = useState(false)
  const [reenviado,  setReenviado]  = useState(false)

  async function reenviar() {
    if (!email) return
    setReenviando(true)
    try {
      const res = await fetch('/api/auth/reenviar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setReenviado(true)
      else toast.error('Não foi possível reenviar. Tente novamente.')
    } catch {
      toast.error('Erro ao reenviar. Tente novamente.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0A0A0F' }}>
      <RacingBg />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo compacto */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
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

          <div className="p-6 text-center">

            {/* Ícone pulsante */}
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute w-20 h-20 rounded-full opacity-10 animate-ping"
                style={{ background: 'rgba(220,0,0,0.5)', animationDuration: '3s' }} />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(220,0,0,0.08)', border: '1px solid rgba(220,0,0,0.25)' }}>
                <Mail className="w-8 h-8" style={{ color: '#DC0000' }} />
              </div>
            </div>

            <p className="text-[10px] font-bold font-racing uppercase tracking-[3px] mb-1" style={{ color: '#DC0000' }}>
              Aguardando confirmação
            </p>
            <h2 className="font-black text-white font-display tracking-wider text-xl mb-3">
              Verifique o E-mail
            </h2>

            <p className="text-sm font-racing mb-1" style={{ color: '#A0A0B8' }}>
              Enviamos um link de acesso para:
            </p>
            {email && (
              <p className="font-bold text-white text-sm mb-4 font-racing">{email}</p>
            )}

            <p className="text-xs font-racing mb-5" style={{ color: '#55556A' }}>
              Clique no link para liberar o acesso ao cockpit. Verifique também o spam.
            </p>

            {/* Indicador de passos */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {[
                { label: 'E-mail enviado', done: true },
                { label: 'Clique no link', done: false },
                { label: 'Acesso liberado', done: false },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: s.done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
                      border: s.done ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    {s.done
                      ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                      : <span className="text-[9px] font-racing" style={{ color: '#2A2A3A' }}>{i + 1}</span>}
                  </div>
                  <span className="text-[9px] font-racing" style={{ color: s.done ? '#4ADE80' : '#2A2A3A' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Botão reenviar */}
            {!reenviado ? (
              <button
                onClick={reenviar}
                disabled={reenviando || !email}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold font-racing text-sm text-white transition-all duration-200 disabled:opacity-40 mb-3"
                style={{
                  background: 'linear-gradient(135deg, #DC0000, #A00000)',
                  boxShadow: !reenviando && email ? '0 0 20px rgba(220,0,0,0.3)' : 'none',
                }}>
                {reenviando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Reenviando...</>
                  : <><Mail className="w-4 h-4" /> Reenviar Link</>}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-3 py-3 rounded-xl font-racing text-sm font-bold"
                style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80' }}>
                <CheckCircle className="w-4 h-4" />
                Link reenviado com sucesso!
              </div>
            )}

            <Link href="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold font-racing transition-all"
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

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerificarEmailContent />
    </Suspense>
  )
}
