'use client'
import { UploadFotos } from './upload-fotos'

interface Props {
  agendamentoId: string
  fotoAntes: string[]
  fotoDepois: string[]
  editavel: boolean
}

export function FotosAgendamento({ agendamentoId, fotoAntes, fotoDepois, editavel }: Props) {
  return (
    <div className="card space-y-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registro Fotográfico</p>
      <UploadFotos
        agendamentoId={agendamentoId}
        tipo="antes"
        fotos={fotoAntes}
        readOnly={!editavel}
      />
      <div className="border-t border-gray-50" />
      <UploadFotos
        agendamentoId={agendamentoId}
        tipo="depois"
        fotos={fotoDepois}
        readOnly={!editavel}
      />
    </div>
  )
}
