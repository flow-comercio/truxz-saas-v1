'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Check, ChevronRight, ChevronLeft,
  Loader2, Store, User, CreditCard, Rocket, Eye, EyeOff
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Plano {
  id: string; nome: string; tipo: string; preco: string; descricao: string | null
  limiteAgendamentosMes: number; limiteOperadores: number
  permiteRelatorios: boolean; permiteWhatsapp: boolean; permiteIA: boolean
}

const TIPO_COLOR: Record<string, string> = {
  basico: 'border-gray-200', profissional: 'border-orange-400', premium: 'border-amber-400'
}
const TIPO_BADGE: Record<string, string> = {
  basico: '', profissional: '⭐ Mais popular', premium: '🏆 Completo'
}

const STEPS = ['Plano', 'Sua Loja', 'Acesso', 'Finalizar']

export default function CadastrarPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [planoSelecionado, setPlano] = useState<Plano | null>(null)
  const [showSenha, setShowSenha] = useState(false)
  const [concluido, setConcluido] = useState<any>(null)

  const [loja, setLoja] = useState({ nomeLoja: '', email: '', telefone: '', cidade: '', estado: '' })
  const [admin, setAdmin] = useState({ adminNome: '', adminEmail: '', adminSenha: '' })

  const { data: planos = [], isLoading: carregandoPlanos } = useQuery<Plano[]>({
    queryKey: ['planos-publicos'],
    queryFn: () => fetch('/api/public/planos').then(r => r.json()),
  })

  const cadastrarMutation = useMutation({
    mutationFn: () =>
      fetch('/api/public/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...loja, ...admin,
          planoId: planoSelecionado?.id,
          metodoPagamento: 'trial',
        }),
      }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Erro ao criar loja')
        return json
      }),
    onSuccess: (data) => setConcluido(data.loja),
    onError: (e: Error) => toast.error(e.message),
  })

  function next() { setStep(s => Math.min(s + 1, 3)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  const stepValido = [
    !!planoSelecionado,
    !!loja.nomeLoja && !!loja.email,
    !!admin.adminNome && !!admin.adminEmail && admin.adminSenha.length >= 6,
    true,
  ]

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (concluido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja criada! 🎉</h1>
          <p className="text-gray-500 mb-6">
            Você tem <strong>14 dias gratuitos</strong> para explorar tudo.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Sua loja pública</span>
              <a href={concluido.linkPublico} className="text-orange-600 font-semibold truncate ml-2">
                {concluido.linkPublico}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seu painel</span>
              <a href={concluido.linkAdmin} className="text-orange-600 font-semibold">
                Abrir painel
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Enviamos os detalhes para o seu email.
          </p>
          <a href={concluido.linkAdmin} className="btn-primary w-full justify-center">
            Acessar meu painel agora
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-3">
            <Car className="w-7 h-7 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-white">TRUXZ</h1>
          <p className="text-orange-200 text-sm mt-1">14 dias grátis • Sem cartão de crédito</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Progress */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-1">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    i < step  ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-orange-600 text-white' :
                                 'bg-gray-100 text-gray-400'
                  )}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block',
                    i === step ? 'text-orange-600' : 'text-gray-400'
                  )}>{label}</span>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-100 mx-1" />}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* ── STEP 0: Plano ────────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-3">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Escolha seu plano</h2>
                {carregandoPlanos ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
                ) : (
                  planos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlano(p)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all hover:border-orange-300',
                        planoSelecionado?.id === p.id
                          ? 'border-orange-500 bg-orange-50'
                          : TIPO_COLOR[p.tipo] ?? 'border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-gray-900">{p.nome}</p>
                            {TIPO_BADGE[p.tipo] && (
                              <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                                {TIPO_BADGE[p.tipo]}
                              </span>
                            )}
                          </div>
                          {p.descricao && <p className="text-xs text-gray-500">{p.descricao}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs text-gray-400">✓ {p.limiteAgendamentosMes} agendamentos/mês</span>
                            <span className="text-xs text-gray-400">✓ {p.limiteOperadores} operadores</span>
                            {p.permiteRelatorios && <span className="text-xs text-gray-400">✓ Relatórios</span>}
                            {p.permiteWhatsapp && <span className="text-xs text-gray-400">✓ WhatsApp</span>}
                            {p.permiteIA && <span className="text-xs text-gray-400">✓ IA</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-orange-600 text-lg">
                            {formatCurrency(parseFloat(p.preco))}
                          </p>
                          <p className="text-xs text-gray-400">/mês</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── STEP 1: Dados da loja ─────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-4">
                  <Store className="inline w-5 h-5 mr-2 text-orange-600" />
                  Dados da sua loja
                </h2>
                <div>
                  <label className="label">Nome da loja *</label>
                  <input className="input" placeholder="Ex: TRUXZ Centro" value={loja.nomeLoja}
                    onChange={e => setLoja(f => ({ ...f, nomeLoja: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">Email de contato *</label>
                  <input type="email" className="input" placeholder="contato@minhaloja.com" value={loja.email}
                    onChange={e => setLoja(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">WhatsApp / Telefone</label>
                  <input className="input" placeholder="(11) 99999-9999" value={loja.telefone}
                    onChange={e => setLoja(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="label">Cidade</label>
                    <input className="input" placeholder="São Paulo" value={loja.cidade}
                      onChange={e => setLoja(f => ({ ...f, cidade: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <input className="input" placeholder="SP" maxLength={2}
                      value={loja.estado}
                      onChange={e => setLoja(f => ({ ...f, estado: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Dados de acesso ───────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-4">
                  <User className="inline w-5 h-5 mr-2 text-orange-600" />
                  Seu acesso de administrador
                </h2>
                <div>
                  <label className="label">Seu nome *</label>
                  <input className="input" placeholder="Nome completo" value={admin.adminNome}
                    onChange={e => setAdmin(f => ({ ...f, adminNome: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">Seu email de login *</label>
                  <input type="email" className="input" placeholder="seu@email.com" value={admin.adminEmail}
                    onChange={e => setAdmin(f => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Senha *</label>
                  <div className="relative">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Mínimo 6 caracteres"
                      value={admin.adminSenha}
                      onChange={e => setAdmin(f => ({ ...f, adminSenha: e.target.value }))}
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
              </div>
            )}

            {/* ── STEP 3: Confirmação ───────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-4">
                  <CreditCard className="inline w-5 h-5 mr-2 text-orange-600" />
                  Confirmar e criar loja
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plano</span>
                    <span className="font-semibold">{planoSelecionado?.nome} — {formatCurrency(parseFloat(planoSelecionado?.preco ?? '0'))}/mês</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loja</span>
                    <span className="font-semibold">{loja.nomeLoja}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Admin</span>
                    <span className="font-semibold">{admin.adminEmail}</span>
                  </div>
                  {loja.cidade && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cidade</span>
                      <span className="font-semibold">{loja.cidade}/{loja.estado}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-700">Cobrado hoje</span>
                    <span className="font-bold text-emerald-600 text-base">R$ 0,00</span>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-800">
                  ✅ <strong>14 dias grátis</strong> — sem cartão de crédito. Após o trial você escolhe como pagar.
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={back} className="btn-secondary flex-shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={next}
                  disabled={!stepValido[step]}
                  className="btn-primary flex-1"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => cadastrarMutation.mutate()}
                  disabled={cadastrarMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {cadastrarMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando sua loja...</>
                    : <><Rocket className="w-4 h-4" /> Criar minha loja grátis</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-orange-200 text-xs mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-white font-semibold underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
