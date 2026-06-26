'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', senha: '' })
  const [msgVerificacao, setMsgVerificacao] = useState<
    'verificado' | 'nao-verificado' | 'token-invalido' | 'token-expirado' | null
  >(null)

  useEffect(() => {
    const error    = params.get('error')
    const verificado = params.get('verificado')
    if (verificado === '1')                  setMsgVerificacao('verificado')
    else if (error === 'EmailNaoVerificado') setMsgVerificacao('nao-verificado')
    else if (error === 'TokenInvalido')      setMsgVerificacao('token-invalido')
    else if (error === 'TokenExpirado')      setMsgVerificacao('token-expirado')
  }, [params])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: form.email,
        senha: form.senha,
        redirect: false,
      })
      if (res?.error === 'EmailNaoVerificado') {
        router.push(`/login/verificar-email?email=${encodeURIComponent(form.email)}`)
      } else if (res?.error) {
        toast.error('E-mail ou senha incorretos')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-5 relative overflow-hidden">
      {/* Orb roxo central */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 65% 75% at 50% 55%, rgba(157,78,221,0.2) 0%, transparent 65%)',
      }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'rgba(157,78,221,0.06)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Banners de verificação */}
        {msgVerificacao === 'verificado' && (
          <div className="flex items-start gap-3 rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.25)' }}>
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-[#34C759]" />
            <div>
              <p className="text-sm font-black text-[#34C759]">E-mail confirmado!</p>
              <p className="text-xs mt-0.5 text-white/50">Você já pode acessar o painel.</p>
            </div>
          </div>
        )}
        {msgVerificacao === 'nao-verificado' && (
          <div className="flex items-start gap-3 rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)' }}>
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-[#FF9F0A]" />
            <div>
              <p className="text-sm font-black text-[#FF9F0A]">E-mail não confirmado</p>
              <p className="text-xs mt-0.5 text-white/50">
                Verifique sua caixa de entrada ou{' '}
                <a href={`/login/verificar-email?email=${encodeURIComponent(form.email)}`}
                  className="underline font-bold text-[#FF9F0A]">reenvie o link</a>.
              </p>
            </div>
          </div>
        )}
        {(msgVerificacao === 'token-invalido' || msgVerificacao === 'token-expirado') && (
          <div className="flex items-start gap-3 rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(255,55,95,0.08)', border: '1px solid rgba(255,55,95,0.25)' }}>
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-[#FF375F]" />
            <div>
              <p className="text-sm font-black text-[#FF375F]">
                {msgVerificacao === 'token-expirado' ? 'Link expirado' : 'Link inválido'}
              </p>
              <p className="text-xs mt-0.5 text-white/50">
                <a href="/login/verificar-email" className="underline font-bold text-[#FF375F]">
                  Solicite um novo link
                </a>.
              </p>
            </div>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-5"
            style={{
              background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)',
              boxShadow: '0 0 60px rgba(157,78,221,0.5), 0 0 120px rgba(157,78,221,0.15)',
            }}>
            <img src="/logo-truxz.png" alt="TRUXZ" className="w-11 h-11 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gradient">TRUXZ</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/25 mt-2">
            Gestão para Estéticas Automotivas
          </p>
        </div>

        {/* Card glass */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-brand" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/35">Acesso ao painel</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
              style={{ height: 52 }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                : 'Entrar'}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="/login/recuperar-senha"
              className="text-xs font-bold text-white/25 hover:text-brand-light transition-colors">
              Esqueci minha senha
            </a>
          </div>
        </div>

        <p className="text-center text-xs mt-5 text-white/20">
          Sem acesso?{' '}
          <a href="/cadastrar" className="font-bold text-brand hover:text-brand-light transition-colors">
            Cadastrar minha loja
          </a>
        </p>

        <p className="text-center text-[10px] mt-3 text-white/10 uppercase tracking-widest">
          TRUXZ · Street Motorsport Management
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
