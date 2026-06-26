import { AdminSidebar } from '@/components/admin/sidebar'
import { ChatAssistente } from '@/components/admin/chat-assistente'
import { PushRegister } from '@/components/push-register'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin_loja', 'master'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0B1E' }}>
      <AdminSidebar />
      <main className="lg:pl-60">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
      <ChatAssistente />
      <PushRegister />
    </div>
  )
}
