import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OperacionalNav } from '@/components/operacional/nav'

export default async function OperacionalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !['operador', 'admin_loja', 'master'].includes(session.user.role)) {
    redirect('/login')
  }
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <OperacionalNav />
    </div>
  )
}
