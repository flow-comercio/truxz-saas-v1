'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

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
    onError: () => toast.error('Erro ao enviar email. Tente novamente.'),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-14 mx-auto mb-2 drop-shadow-lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {!enviado ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Recuperar senha</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Informe seu email e enviaremos um link para redefinição.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      className="input pl-10"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && email && mutation.mutate()}
                    />
                  </div>
                </div>

                <button
                  onClick={() => mutation.mutate()}
                  disabled={!email || mutation.isPending}
                  className="btn-primary w-full"
                >
                  {mutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Mail className="w-4 h-4" />}
                  {mutation.isPending ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-2">Email enviado!</h2>
              <p className="text-sm text-gray-500">
                Se <strong>{email}</strong> estiver cadastrado, você receberá as instruções em breve.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Verifique também a caixa de spam. O link expira em 1 hora.
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
