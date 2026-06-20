'use client'
import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Loader2, Save, Clock, Bell, Palette, Store,
  MapPin, Upload, Phone, Mail, Eye, ExternalLink
} from 'lucide-react'
import Image from 'next/image'

const DIAS = [
  { num: 1, label: 'Seg' }, { num: 2, label: 'Ter' }, { num: 3, label: 'Qua' },
  { num: 4, label: 'Qui' }, { num: 5, label: 'Sex' }, { num: 6, label: 'Sáb' },
  { num: 0, label: 'Dom' },
]

const CORES_PRESET = [
  '#ea580c','#dc2626','#16a34a','#2563eb','#7c3aed','#db2777','#0891b2','#111827'
]

const DEFAULT: any = {
  nome: '', telefone: '', email: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidade: '', estado: '', cep: '',
  corPrimaria: '#ea580c',
  configuracoes: {
    horarioAbertura: '08:00', horarioFechamento: '18:00',
    diasFuncionamento: [1, 2, 3, 4, 5, 6],
    intervaloAgendamento: 60,
    mensagemBoasVindas: '', notificacaoWhatsapp: false, whatsapp: '',
  },
}

export default function ConfiguracoesPage() {
  const logoRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<any>(DEFAULT)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [tab, setTab] = useState<'geral' | 'aparencia' | 'horarios' | 'endereco'>('geral')

  // Carrega dados atuais
  const { isLoading } = useQuery({
    queryKey: ['configuracoes-loja'],
    queryFn: () => fetch('/api/lojas/aparencia').then(r => r.json()),
    onSuccess: (data: any) => {
      if (data) {
        setForm((f: any) => ({ ...DEFAULT, ...data, configuracoes: { ...DEFAULT.configuracoes, ...(data.configuracoes ?? {}) } }))
        setLogoUrl(data.logoUrl)
      }
    },
  } as any)

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch('/api/lojas/aparencia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(async r => {
        if (!r.ok) throw new Error('Erro ao salvar')
        return r.json()
      }),
    onSuccess: () => toast.success('Configurações salvas!'),
    onError: () => toast.error('Erro ao salvar configurações'),
  })

  const logoMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('logo', file)
      return fetch('/api/upload/logo', { method: 'POST', body: fd }).then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error)
        return json as { url: string }
      })
    },
    onSuccess: (data) => {
      setLogoUrl(data.url)
      setLogoPreview(null)
      toast.success('Logo atualizada!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    logoMutation.mutate(file)
    e.target.value = ''
  }

  function setConfig(key: string, value: any) {
    setForm((f: any) => ({ ...f, configuracoes: { ...f.configuracoes, [key]: value } }))
  }

  function toggleDia(dia: number) {
    const dias = form.configuracoes.diasFuncionamento as number[]
    setConfig('diasFuncionamento', dias.includes(dia) ? dias.filter((d: number) => d !== dia) : [...dias, dia])
  }

  const slug = typeof window !== 'undefined'
    ? window.location.hostname.split('.')[0]
    : ''

  const TABS = [
    { key: 'geral',     label: 'Geral',     icon: Store },
    { key: 'aparencia', label: 'Aparência',  icon: Palette },
    { key: 'horarios',  label: 'Horários',   icon: Clock },
    { key: 'endereco',  label: 'Endereço',   icon: MapPin },
  ] as const

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary text-xs px-3 py-2">
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar tudo
        </button>
      </div>

      {/* Preview do link público */}
      {slug && (
        <a
          href={`//${slug}.${typeof window !== 'undefined' ? window.location.host.replace(/^[^.]+\./, '') : ''}`}
          target="_blank"
          className="flex items-center gap-2 text-xs text-orange-600 font-medium hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver minha loja pública
        </a>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── GERAL ─────────────────────────────────────────────────────── */}
      {tab === 'geral' && (
        <div className="card space-y-4">
          <div>
            <label className="label">Nome da loja</label>
            <input className="input" value={form.nome} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Telefone</label>
              <input className="input" value={form.telefone} onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="label flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp (número com DDD)
            </label>
            <input className="input" value={form.configuracoes.whatsapp} onChange={e => setConfig('whatsapp', e.target.value)} placeholder="11999999999" />
          </div>
          <div>
            <label className="label">Mensagem de boas-vindas</label>
            <textarea className="input" rows={2} value={form.configuracoes.mensagemBoasVindas}
              onChange={e => setConfig('mensagemBoasVindas', e.target.value)}
              placeholder="Aparece na sua página pública..." />
          </div>
          {/* Notificação WhatsApp */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Notificações WhatsApp</p>
              <p className="text-xs text-gray-400">Avisa clientes sobre agendamentos</p>
            </div>
            <div
              onClick={() => setConfig('notificacaoWhatsapp', !form.configuracoes.notificacaoWhatsapp)}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.configuracoes.notificacaoWhatsapp ? 'bg-orange-600' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.configuracoes.notificacaoWhatsapp ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      )}

      {/* ── APARÊNCIA ─────────────────────────────────────────────────── */}
      {tab === 'aparencia' && (
        <div className="card space-y-5">
          {/* Logo */}
          <div>
            <label className="label">Logo da loja</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {(logoPreview || logoUrl) ? (
                  <img src={logoPreview || logoUrl!} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={logoMutation.isPending}
                  className="btn-secondary text-sm w-full"
                >
                  {logoMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Upload className="w-4 h-4" />}
                  {logoMutation.isPending ? 'Enviando...' : 'Enviar logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">PNG, JPG, WebP ou SVG. Máximo 2MB.</p>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          {/* Cor primária */}
          <div>
            <label className="label">Cor principal da loja</label>
            <div className="flex items-center gap-3 flex-wrap">
              {CORES_PRESET.map(cor => (
                <button
                  key={cor}
                  onClick={() => setForm((f: any) => ({ ...f, corPrimaria: cor }))}
                  style={{ backgroundColor: cor }}
                  className={`w-10 h-10 rounded-full transition-all ${form.corPrimaria === cor ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                />
              ))}
              {/* Custom color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={form.corPrimaria}
                  onChange={e => setForm((f: any) => ({ ...f, corPrimaria: e.target.value }))}
                  className="w-10 h-10 rounded-full cursor-pointer border-0 p-0"
                  title="Cor personalizada"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: form.corPrimaria }} />
              <p className="text-sm text-gray-600">{form.corPrimaria}</p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="label flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Preview do botão</label>
            <button
              style={{ backgroundColor: form.corPrimaria }}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            >
              Agendar Serviço
            </button>
          </div>
        </div>
      )}

      {/* ── HORÁRIOS ──────────────────────────────────────────────────── */}
      {tab === 'horarios' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Abertura</label>
              <input type="time" className="input" value={form.configuracoes.horarioAbertura}
                onChange={e => setConfig('horarioAbertura', e.target.value)} />
            </div>
            <div>
              <label className="label">Fechamento</label>
              <input type="time" className="input" value={form.configuracoes.horarioFechamento}
                onChange={e => setConfig('horarioFechamento', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Intervalo entre agendamentos</label>
            <select className="input" value={form.configuracoes.intervaloAgendamento}
              onChange={e => setConfig('intervaloAgendamento', +e.target.value)}>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1h30</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
          <div>
            <label className="label">Dias de funcionamento</label>
            <div className="flex gap-2 flex-wrap">
              {DIAS.map(({ num, label }) => (
                <button key={num} onClick={() => toggleDia(num)}
                  className={`w-11 h-11 rounded-xl text-sm font-semibold border-2 transition-all ${
                    (form.configuracoes.diasFuncionamento as number[]).includes(num)
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-100 bg-white text-gray-400'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ENDEREÇO ──────────────────────────────────────────────────── */}
      {tab === 'endereco' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Logradouro</label>
              <input className="input" placeholder="Rua, Avenida..." value={form.logradouro}
                onChange={e => setForm((f: any) => ({ ...f, logradouro: e.target.value }))} />
            </div>
            <div>
              <label className="label">Número</label>
              <input className="input" placeholder="123" value={form.numero}
                onChange={e => setForm((f: any) => ({ ...f, numero: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Complemento</label>
            <input className="input" placeholder="Sala, Loja..." value={form.complemento}
              onChange={e => setForm((f: any) => ({ ...f, complemento: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bairro</label>
              <input className="input" value={form.bairro}
                onChange={e => setForm((f: any) => ({ ...f, bairro: e.target.value }))} />
            </div>
            <div>
              <label className="label">CEP</label>
              <input className="input" placeholder="00000-000" value={form.cep}
                onChange={e => setForm((f: any) => ({ ...f, cep: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Cidade</label>
              <input className="input" value={form.cidade}
                onChange={e => setForm((f: any) => ({ ...f, cidade: e.target.value }))} />
            </div>
            <div>
              <label className="label">Estado</label>
              <input className="input" maxLength={2} value={form.estado}
                onChange={e => setForm((f: any) => ({ ...f, estado: e.target.value.toUpperCase() }))} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
