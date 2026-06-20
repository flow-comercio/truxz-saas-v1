'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { User, Phone, Mail, Lock, LogOut, Loader2, ChevronRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function PerfilPage() {
  const { data: session } = useSession()
  const [showSenha, setShowSenha] = useState(false)
  const [senhaForm, setSenhaForm] = useState({ atual: '', nova: '', confirmar: '' })

  const trocaSenha = useMutation({
    mutationFn: (data: typeof senhaForm) =>
      fetch('/api/perfil/senha', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro')
        return json
      }),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!')
      setShowSenha(false)
      setSenhaForm({ atual: '', nova: '', confirmar: '' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const nome  = session?.user.name  ?? ''
  const email = session?.user.email ?? ''

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 px-5 pt-12 pb-10">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">{getInitials(nome)}</span>
          </div>
          <h1 className="text-white text-xl font-bold">{nome}</h1>
          <p className="text-orange-200 text-sm mt-1">{email}</p>
        </div>
      </div>

      <div className="p-4 space-y-3 -mt-4">
        {/* Info card */}
        <div className="card space-y-3">
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Nome</p>
              <p className="text-sm font-medium text-gray-900">{nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{email}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card !p-0 overflow-hidden">
          <button
            onClick={() => setShowSenha(!showSenha)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Alterar senha</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${showSenha ? 'rotate-90' : ''}`} />
          </button>

          {showSenha && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
              <input type="password" className="input mt-3" placeholder="Senha atual"
                value={senhaForm.atual} onChange={e => setSenhaForm(f => ({ ...f, atual: e.target.value }))} />
              <input type="password" className="input" placeholder="Nova senha"
                value={senhaForm.nova} onChange={e => setSenhaForm(f => ({ ...f, nova: e.target.value }))} />
              <input type="password" className="input" placeholder="Confirmar nova senha"
                value={senhaForm.confirmar} onChange={e => setSenhaForm(f => ({ ...f, confirmar: e.target.value }))} />
              <button
                onClick={() => trocaSenha.mutate(senhaForm)}
                disabled={!senhaForm.atual || !senhaForm.nova || senhaForm.nova !== senhaForm.confirmar || trocaSenha.isPending}
                className="btn-primary w-full"
              >
                {trocaSenha.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Salvar Senha
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-100 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
