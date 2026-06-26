'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Car, Plus, Loader2, Trash2, Pencil } from 'lucide-react'
import { SwipeCard } from '@/components/ui/swipe-card'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Veiculo {
  id: string; placa: string; marca: string | null; modelo: string | null
  ano: number | null; cor: string | null; tipo: string
}

const TIPOS = ['carro', 'moto', 'caminhonete', 'van', 'caminhao']
const TIPO_EMOJI: Record<string, string> = {
  carro: '🚗', moto: '🏍️', caminhonete: '🛻', van: '🚐', caminhao: '🚚',
}
const TIPO_COLOR: Record<string, string> = {
  carro: '#3F8EFF', moto: '#FF375F', caminhonete: '#FF9F0A', van: '#34C759', caminhao: '#9D4EDD',
}
const EMPTY = { placa: '', marca: '', modelo: '', ano: '', cor: '', tipo: 'carro' }

export default function VeiculosPage() {
  const qc = useQueryClient()
  const [showSheet, setShowSheet] = useState(false)
  const [editing, setEditing]     = useState<Veiculo | null>(null)
  const [form, setForm]           = useState(EMPTY)

  const { data: veiculos = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos-cliente'],
    queryFn:  () => fetch('/api/veiculos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = { ...data, ano: data.ano ? parseInt(data.ano) : undefined }
      if (editing)
        return fetch(`/api/veiculos/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
      return fetch('/api/veiculos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      toast.success(editing ? 'Veículo atualizado!' : 'Veículo cadastrado!')
      qc.invalidateQueries({ queryKey: ['veiculos-cliente'] })
      setShowSheet(false); setEditing(null); setForm(EMPTY)
    },
    onError: () => toast.error('Erro ao salvar veículo'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/veiculos/${id}`, { method: 'DELETE' }),
    onSuccess:  () => { toast.success('Veículo removido'); qc.invalidateQueries({ queryKey: ['veiculos-cliente'] }) },
    onError:    () => toast.error('Erro ao remover veículo'),
  })

  function openNew() {
    setEditing(null); setForm(EMPTY); setShowSheet(true)
  }
  function openEdit(v: Veiculo) {
    setEditing(v)
    setForm({ placa: v.placa, marca: v.marca ?? '', modelo: v.modelo ?? '', ano: v.ano?.toString() ?? '', cor: v.cor ?? '', tipo: v.tipo })
    setShowSheet(true)
  }

  return (
    <div className="min-h-screen pb-28">

      {/* ── HEADER ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 safe-top glass-strong flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid rgba(157,78,221,0.1)' }}>
        <div>
          <h1 className="font-black text-white">Meus Veículos</h1>
          <p className="text-xs text-white/35 mt-0.5">{veiculos.length} cadastrado(s)</p>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-3" style={{ height: 36 }}>
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#9D4EDD]" />
          </div>
        ) : veiculos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)' }}>
              <Car className="w-10 h-10 text-white/20" />
            </div>
            <p className="font-black text-white mb-1">Nenhum veículo cadastrado</p>
            <p className="text-sm text-white/35 mb-5">Adicione seu veículo para agilizar agendamentos</p>
            <button onClick={openNew} className="btn-primary mx-auto px-6">
              Cadastrar veículo
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 pl-1">
              ← deslize para excluir · editar →
            </p>
            {veiculos.map(v => {
              const color = TIPO_COLOR[v.tipo] ?? '#9D4EDD'
              return (
                <SwipeCard
                  key={v.id}
                  onSwipeLeft={() => deleteMutation.mutate(v.id)}
                  onSwipeRight={() => openEdit(v)}
                  leftLabel="Excluir"
                  rightLabel="Editar"
                >
                  <div className="card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${color}12`, border: `1.5px solid ${color}30` }}>
                        {TIPO_EMOJI[v.tipo] ?? '🚗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-black text-white tracking-widest">{v.placa}</p>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full capitalize"
                            style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
                            {v.tipo}
                          </span>
                        </div>
                        <p className="text-sm text-white/60">
                          {[v.marca, v.modelo].filter(Boolean).join(' ')}
                          {v.ano ? ` · ${v.ano}` : ''}
                        </p>
                        {v.cor && <p className="text-xs text-white/30 mt-0.5">{v.cor}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(v)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-[#C77DFF] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(v.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-[#FF375F] transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </SwipeCard>
              )
            })}
          </>
        )}
      </div>

      {/* ── BOTTOM SHEET FORM ──────────────────────── */}
      <BottomSheet
        open={showSheet}
        onClose={() => { setShowSheet(false); setEditing(null) }}
        title={editing ? 'Editar Veículo' : 'Novo Veículo'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Placa *</label>
            <input className="input" maxLength={8} placeholder="ABC1234 ou ABC1D23"
              value={form.placa}
              onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
              disabled={!!editing} />
          </div>

          <div>
            <label className="label mb-2">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t => {
                const color = TIPO_COLOR[t] ?? '#9D4EDD'
                const sel   = form.tipo === t
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className="py-2 px-2 rounded-xl text-xs font-black transition-all capitalize"
                    style={{
                      background: sel ? `${color}15` : 'rgba(255,255,255,0.03)',
                      border:     `1.5px solid ${sel ? color + '50' : 'rgba(255,255,255,0.08)'}`,
                      color:      sel ? color : '#A0A0B8',
                    }}>
                    {TIPO_EMOJI[t]} {t}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marca</label>
              <input className="input" placeholder="Toyota"
                value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
            </div>
            <div>
              <label className="label">Modelo</label>
              <input className="input" placeholder="Corolla"
                value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ano</label>
              <input type="number" className="input" placeholder="2022"
                value={form.ano} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cor</label>
              <input className="input" placeholder="Prata"
                value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowSheet(false); setEditing(null) }} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={() => saveMutation.mutate(form)}
              disabled={!form.placa || saveMutation.isPending} className="btn-primary flex-1">
              {saveMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : 'Salvar'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
