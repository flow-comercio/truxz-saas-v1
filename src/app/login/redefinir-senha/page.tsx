'use client'
import { useState, Suspense } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function RedefinirForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ novaSenha: '', confirmarSenha: '' })
  const [showSenha, setShowSenha] = useState(false)
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

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 font-semibold">Link inválido ou expirado.</p>
        <Link href="/login/recuperar-senha" className="text-orange-600 text-sm mt-2 block">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  const senhasIguais = form.novaSenha === form.confirmarSenha
  const formValido   = form.novaSenha.length >= 6 && senhasIguais

  return concluido ? (
    <div className="text-center py-4">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7 text-emerald-600" />
      </div>
      <h2 className="font-bold text-gray-900 text-lg mb-2">Senha redefinida!</h2>
      <p className="text-sm text-gray-500">Redirecionando para o login...</p>
    </div>
  ) : (
    <>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">Nova senha</h2>
        <p className="text-sm text-gray-500 mt-1">Escolha uma senha com no mínimo 6 caracteres.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showSenha ? 'text' : 'password'}
              className="input pl-10 pr-10"
              placeholder="••••••••"
              value={form.novaSenha}
              onChange={e => setForm(f => ({ ...f, novaSenha: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowSenha(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirmar nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showSenha ? 'text' : 'password'}
              className="input pl-10"
              placeholder="••••••••"
              value={form.confirmarSenha}
              onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
            />
          </div>
          {form.confirmarSenha && !senhasIguais && (
            <p className="text-xs text-red-500 mt-1">As senhas não conferem</p>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!formValido || mutation.isPending}
          className="btn-primary w-full"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {mutation.isPending ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </div>
    </>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-truxz.png" alt="TRUXZ" className="h-14 mx-auto mb-2 drop-shadow-lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>}>
            <RedefinirForm />
          </Suspense>

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
