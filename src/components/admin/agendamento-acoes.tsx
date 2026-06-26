'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Play, CheckCircle, XCircle, UserCheck, Loader2 } from 'lucide-react'

interface Props {
  id: string
  statusAtual: string
}

export function AgendamentoAcoes({ id, statusAtual }: Props) {
  const router = useRouter()

  const updateMutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/agendamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Status atualizado!')
      router.refresh()
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  const pending = updateMutation.isPending

  return (
    <div className="card space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ações</p>

      <div className="grid grid-cols-2 gap-2">
        {statusAtual === 'pendente' && (
          <>
            <button
              onClick={() => updateMutation.mutate('confirmado')}
              disabled={pending}
              className="btn-secondary text-sm"
            >
              <UserCheck className="w-4 h-4 text-blue-500" />
              Confirmar
            </button>
            <button
              onClick={() => updateMutation.mutate('em_andamento')}
              disabled={pending}
              className="btn-primary text-sm"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>
          </>
        )}

        {statusAtual === 'confirmado' && (
          <button
            onClick={() => updateMutation.mutate('em_andamento')}
            disabled={pending}
            className="btn-primary text-sm col-span-2"
          >
            <Play className="w-4 h-4" />
            Iniciar Serviço
          </button>
        )}

        {statusAtual === 'em_andamento' && (
          <button
            onClick={() => updateMutation.mutate('concluido')}
            disabled={pending}
            className="btn-primary col-span-2 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Marcar como Concluído
          </button>
        )}

        {!['concluido', 'cancelado', 'no_show'].includes(statusAtual) && (
          <button
            onClick={() => {
              if (confirm('Cancelar este agendamento?')) {
                updateMutation.mutate('cancelado')
              }
            }}
            disabled={pending}
            className="btn-danger text-sm col-span-2"
          >
            <XCircle className="w-4 h-4" />
            Cancelar Agendamento
          </button>
        )}

        {(statusAtual === 'concluido' || statusAtual === 'cancelado') && (
          <div className="col-span-2 text-center py-2 text-sm text-gray-400">
            Agendamento finalizado
          </div>
        )}
      </div>
    </div>
  )
}
