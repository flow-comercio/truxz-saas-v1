import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  switch (session.user.role) {
    case 'master':       redirect('/master/dashboard')
    case 'admin_loja':   redirect('/admin/dashboard')
    case 'operador':     redirect('/operacional/fila')
    case 'cliente':      redirect('/cliente')
    default:             redirect('/login')
  }
}
