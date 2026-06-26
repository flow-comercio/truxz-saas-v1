import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClienteNav } from '@/components/cliente/nav'
import { ChatAtendimento } from '@/components/cliente/chat-atendimento'
import { PushRegister } from '@/components/push-register'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return (
    <div className="min-h-screen pb-20" style={{ background: '#0D0B1E' }}>
      {children}
      <ClienteNav />
      <ChatAtendimento />
      <PushRegister />
    </div>
  )
}
