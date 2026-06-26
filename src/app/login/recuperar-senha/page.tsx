'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

/* Fundo motorsport reutilizado em todas as páginas de auth */
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

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(r => r.json()),
    onSuccess: () => setEnviado(true),
    onError:   () => toast.error('Erro ao enviar e-mail. Tente novamente.'),
  })

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
            {!enviado ? (
              <>
                {/* Ícone + título */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(220,0,0,0.1)', border: '1px solid rgba(220,0,0,0.25)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#DC0000' }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white font-display tracking-wider">Recuperar Acesso</h2>
                    <p className="text-xs mt-0.5 font-racing" style={{ color: '#55556A' }}>
                      Informe seu e-mail e enviaremos um link de redefinição.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase tracking-[2px] font-racing"
                      style={{ color: '#55556A' }}>E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: '#3A3A4A' }} />
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="input-racing pl-10"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && email && mutation.mutate()}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => mutation.mutate()}
                    disabled={!email || mutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold font-racing text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #DC0000, #A00000)',
                      boxShadow: email && !mutation.isPending ? '0 0 22px rgba(220,0,0,0.35)' : 'none',
                    }}>
                    {mutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Send className="w-4 h-4" /> Enviar Link de Acesso</>}
                  </button>
                </div>
              </>
            ) : (
              /* Estado: enviado */
              <div className="text-center py-3">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute w-20 h-20 rounded-full opacity-15 animate-ping"
                    style={{ background: 'rgba(74,222,128,0.4)', animationDuration: '2.5s' }} />
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.35)' }}>
                    <span className="text-3xl">📨</span>
                  </div>
                </div>

                <p className="text-[10px] font-bold font-racing uppercase tracking-[3px] mb-1" style={{ color: '#4ADE80' }}>
                  Link disparado!
                </p>
                <h2 className="font-black text-white font-display tracking-wider text-xl mb-3">E-mail Enviado</h2>
                <p className="text-sm font-racing" style={{ color: '#A0A0B8' }}>
                  Se <strong className="text-white">{email}</strong> estiver cadastrado, você receberá as instruções em breve.
                </p>
                <p className="text-xs mt-2 font-racing" style={{ color: '#55556A' }}>
                  Verifique também o spam. O link expira em 1 hora.
                </p>
              </div>
            )}

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
