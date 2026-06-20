import Link from 'next/link'
import { Car } from 'lucide-react'

export default function TenantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">
          Este endereço não corresponde a nenhuma loja cadastrada no TRUXZ.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex mx-auto"
        >
          Criar minha loja
        </Link>
      </div>
    </div>
  )
}
