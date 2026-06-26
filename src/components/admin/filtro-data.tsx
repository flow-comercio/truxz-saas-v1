'use client'
import { CalendarDays } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  dataAtual: string
  total: number
}

export function FiltroData({ dataAtual, total }: Props) {
  const router = useRouter()

  function handleChange(valor: string) {
    const params = new URLSearchParams()
    params.set('data', valor)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="card !p-3 flex items-center gap-3">
      <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <input
        type="date"
        defaultValue={dataAtual}
        className="flex-1 text-sm font-medium text-gray-700 bg-transparent outline-none"
        onChange={e => handleChange(e.target.value)}
      />
      <span className="text-xs text-gray-400 flex-shrink-0">{total} agendamento(s)</span>
    </div>
  )
}
