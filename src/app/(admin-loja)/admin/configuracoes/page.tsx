'use client'
import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save, Clock, Palette, Store, MapPin, Upload, Phone, Mail, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const DIAS = [
  { num: 1, label: 'Seg' }, { num: 2, label: 'Ter' }, { num: 3, label: 'Qua' },
  { num: 4, label: 'Qui' }, { num: 5, label: 'Sex' }, { num: 6, label: 'Sáb' },
  { num: 0, label: 'Dom' },
]
const CORES_PRESET = [
  '#9D4EDD', '#FF375F', '#3F8EFF', '#34C759',
  '#FF9F0A', '#00D4FF', '#FF6B35', '#7B2FBE',
]
const DEFAULT: any = {
  nome: '', telefone: '', email: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', cep: '', corPrimaria: '#9D4EDD',
  configuracoes: {
    horarioAbertura: '08:00', horarioFechamento: '18:00',
    diasFuncionamento: [1, 2, 3, 4, 5, 6],
    intervaloAgendamento: 60,
    mensagemBoasVindas: '',
    notificacaoWhatsapp: false,
    whatsapp: '',
  },
}

const TABS = [
  { key: 'geral',     label: 'Geral',     Icon: Store },
  { key: 'aparencia', label: 'Aparência',  Icon: Palette },
  { key: 'horarios',  label: 'Horários',   Icon: Clock },
  { key: 'endereco',  label: 'Endereço',   Icon: MapPin },
] as const

type Tab = typeof TABS[number]['key']

export default function ConfiguracoesPage() {
  const logoRef = useRef<HTMLInputElement>(null)
  const [form, setForm]           = useState<any>(DEFAULT)
  const [logoUrl, setLogoUrl]     = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [tab, setTab]             = useState<Tab>('geral')

  const { isLoading } = useQuery({
    queryKey: ['configuracoes-loja'],
    queryFn:  () => fetch('/api/lojas/aparencia').then(r => r.json()),
    onSuccess: (data: any) => {
      if (data) {
        setForm((f: any) => ({
          ...DEFAULT, ...data,
          configuracoes: { ...DEFAULT.configuracoes, ...(data.configuracoes ?? {}) },
        }))
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
      }).then(async r => { if (!r.ok) throw new Error('Erro'); return r.json() }),
    onSuccess: () => toast.success('Configurações salvas!'),
    onError:   () => toast.error('Erro ao salvar configurações'),
  })

  const logoMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('logo', file)
      return fetch('/api/upload/logo', { method: 'POST', body: fd })
        .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j as { url: string } })
    },
    onSuccess: (data) => { setLogoUrl(data.url); setLogoPreview(null); toast.success('Logo atualizada!') },
    onError:   (e: Error) => toast.error(e.message),
  })

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setLogoPreview(URL.createObjectURL(file)); logoMutation.mutate(file); e.target.value = ''
  }
  function setConfig(key: string, value: any) {
    setForm((f: any) => ({ ...f, configuracoes: { ...f.configuracoes, [key]: value } }))
  }
  function toggleDia(dia: number) {
    const dias = form.configuracoes.diasFuncionamento as number[]
    setConfig('diasFuncionamento', dias.includes(dia) ? dias.filter((d: number) => d !== dia) : [...dias, dia])
  }

  const slug = typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : ''

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
    </div>
  )

  return (
    <div className="pb-8 max-w-2xl">
      <PageHeader
        title="Configurações"
        right={
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="btn-primary text-xs px-4" style={{ height: 38 }}>
            {saveMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            Salvar
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Link da loja pública */}
        {slug && (
          <a href={`//${slug}.${typeof window !== 'undefined' ? window.location.host.replace(/^[^.]+\./, '') : ''}`}
            target="_blank"
            className="flex items-center gap-2 text-xs font-bold text-[#9D4EDD] hover:text-[#C77DFF] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Ver minha loja pública
          </a>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black transition-all"
                style={{
                  background: active ? 'rgba(157,78,221,0.15)' : 'transparent',
                  color:      active ? '#C77DFF' : '#55556A',
                  border:     active ? '1px solid rgba(157,78,221,0.3)' : '1px solid transparent',
                }}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>

        {/* ── ABA GERAL ─────────────────────────────────────── */}
        {tab === 'geral' && (
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Nome da loja</label>
              <input className="input" value={form.nome}
                onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Speed Clean Estética" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</label>
                <input className="input" value={form.telefone}
                  onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="label flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</label>
                <input type="email" className="input" value={form.email}
                  onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">WhatsApp (número com DDD)</label>
              <input className="input" value={form.configuracoes.whatsapp}
                onChange={e => setConfig('whatsapp', e.target.value)}
                placeholder="11999999999" />
            </div>
            <div>
              <label className="label">Mensagem de boas-vindas</label>
              <textarea className="input" rows={3} value={form.configuracoes.mensagemBoasVindas}
                onChange={e => setConfig('mensagemBoasVindas', e.target.value)}
                placeholder="Aparece na sua página pública..." />
            </div>

            {/* Toggle WhatsApp */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-sm font-black text-white">Notificações WhatsApp</p>
                <p className="text-xs text-white/35 mt-0.5">Avisa clientes sobre agendamentos</p>
              </div>
              <div
                className={`toggle ${form.configuracoes.notificacaoWhatsapp ? 'on' : ''}`}
                onClick={() => setConfig('notificacaoWhatsapp', !form.configuracoes.notificacaoWhatsapp)}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>
        )}

        {/* ── ABA APARÊNCIA ─────────────────────────────────── */}
        {tab === 'aparencia' && (
          <div className="card p-5 space-y-5">
            {/* Logo upload */}
            <div>
              <label className="label">Logo da loja</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(157,78,221,0.3)' }}>
                  {(logoPreview || logoUrl)
                    ? <img src={logoPreview || logoUrl!} alt="Logo" className="w-full h-full object-cover" />
                    : <Store className="w-8 h-8 text-white/20" />}
                </div>
                <div className="flex-1 space-y-2">
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={logoMutation.isPending}
                    className="btn-secondary w-full text-sm">
                    {logoMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Upload className="w-4 h-4" /> Enviar logo</>}
                  </button>
                  <p className="text-xs text-white/25">PNG, JPG, WebP ou SVG · máx 2MB</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>

            {/* Cor primária */}
            <div>
              <label className="label">Cor principal da loja</label>
              <div className="flex items-center gap-3 flex-wrap mt-2">
                {CORES_PRESET.map(cor => (
                  <button
                    key={cor}
                    onClick={() => setForm((f: any) => ({ ...f, corPrimaria: cor }))}
                    className="transition-all active:scale-90"
                    style={{
                      backgroundColor: cor,
                      width: '2.25rem', height: '2.25rem',
                      borderRadius: '50%',
                      outline: form.corPrimaria === cor ? `3px solid ${cor}` : 'none',
                      outlineOffset: '3px',
                    }} />
                ))}
                <input type="color" value={form.corPrimaria}
                  onChange={e => setForm((f: any) => ({ ...f, corPrimaria: e.target.value }))}
                  className="w-9 h-9 rounded-full cursor-pointer border-0 p-0"
                  title="Cor personalizada" />
              </div>

              {/* Preview do botão */}
              <div className="mt-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="label mb-3">Preview</p>
                <button style={{ backgroundColor: form.corPrimaria }}
                  className="px-5 py-2.5 rounded-xl text-white font-black text-sm">
                  Agendar Serviço
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA HORÁRIOS ──────────────────────────────────── */}
        {tab === 'horarios' && (
          <div className="card p-5 space-y-4">
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
              <div className="flex gap-2 flex-wrap mt-2">
                {DIAS.map(({ num, label }) => {
                  const ativo = (form.configuracoes.diasFuncionamento as number[]).includes(num)
                  return (
                    <button key={num} onClick={() => toggleDia(num)}
                      className="w-11 h-11 rounded-xl text-sm font-black transition-all active:scale-90"
                      style={{
                        background: ativo ? 'rgba(157,78,221,0.15)' : 'rgba(255,255,255,0.03)',
                        border:     `1.5px solid ${ativo ? 'rgba(157,78,221,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color:      ativo ? '#C77DFF' : '#55556A',
                      }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA ENDEREÇO ──────────────────────────────────── */}
        {tab === 'endereco' && (
          <div className="card p-5 space-y-4">
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
    </div>
  )
}
