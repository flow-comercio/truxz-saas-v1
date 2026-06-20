'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Car, Plus, Loader2, Trash2, Pencil } from 'lucide-react'

interface Veiculo {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  ano: number | null
  cor: string | null
  tipo: string
}

const TIPOS = ['carro', 'moto', 'caminhonete', 'van', 'caminhao']
const TIPO_EMOJI: Record<string, string> = {
  carro: '🚗', moto: '🏍️', caminhonete: '🛻', van: '🚐', caminhao: '🚚'
}

const EMPTY = { placa: '', marca: '', modelo: '', ano: '', cor: '', tipo: 'carro' }

export default function VeiculosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Veiculo | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data: veiculos = [], isLoading } = useQuery<Veiculo[]>({
    queryKey: ['veiculos-cliente'],
    queryFn: () => fetch('/api/veiculos').then(r => r.json()),
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = { ...data, ano: data.ano ? parseInt(data.ano) : undefined }
      if (editing) {
        return fetch(`/api/veiculos/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      return fetch('/api/veiculos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      toast.success(editing ? 'Veículo atualizado!' : 'Veículo cadastrado!')
      qc.invalidateQueries({ queryKey: ['veiculos-cliente'] })
      setShowModal(false)
      setEditing(null)
      setForm(EMPTY)
    },
    onError: () => toast.error('Erro ao salvar veículo'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/veiculos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Veículo removido')
      qc.invalidateQueries({ queryKey: ['veiculos-cliente'] })
    },
  })

  function openEdit(v: Veiculo) {
    setEditing(v)
    setForm({
      placa: v.placa, marca: v.marca ?? '', modelo: v.modelo ?? '',
      ano: v.ano?.toString() ?? '', cor: v.cor ?? '', tipo: v.tipo,
    })
    setShowModal(true)
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Meus Veículos</h1>
          <p className="text-xs text-gray-500 mt-0.5">{veiculos.length} cadastrado(s)</p>
        </div>
        <button onClick={openNew} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        ) : veiculos.length === 0 ? (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">Nenhum veículo cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Adicione seu veículo para agilizar agendamentos</p>
            <button onClick={openNew} className="btn-primary mt-4 mx-auto">
              Cadastrar veículo
            </button>
          </div>
        ) : (
          veiculos.map(v => (
            <div key={v.id} className="card !p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {TIPO_EMOJI[v.tipo] ?? '🚗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 tracking-wide">{v.placa}</p>
                    <span className="badge-neutral capitalize">{v.tipo}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {[v.marca, v.modelo].filter(Boolean).join(' ')}
                    {v.ano ? ` (${v.ano})` : ''}
                  </p>
                  {v.cor && <p className="text-xs text-gray-400 mt-0.5">{v.cor}</p>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(v)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Remover veículo?')) deleteMutation.mutate(v.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-5">
              {editing ? 'Editar Veículo' : 'Novo Veículo'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Placa *</label>
                <input
                  className="input uppercase"
                  maxLength={8}
                  placeholder="ABC1234 ou ABC1D23"
                  value={form.placa}
                  onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="label">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`py-2 px-3 rounded-xl text-sm border-2 transition-all capitalize font-medium ${
                        form.tipo === t
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {TIPO_EMOJI[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Marca</label>
                  <input className="input" placeholder="Toyota" value={form.marca}
                    onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <input className="input" placeholder="Corolla" value={form.modelo}
                    onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ano</label>
                  <input type="number" className="input" placeholder="2022" value={form.ano}
                    onChange={e => setForm(f => ({ ...f, ano: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cor</label>
                  <input className="input" placeholder="Prata" value={form.cor}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.placa || saveMutation.isPending}
                className="btn-primary flex-1"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
