import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MasterSidebar } from '@/components/admin/master-sidebar'

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'master') redirect('/login')
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <MasterSidebar />
      <main className="lg:pl-60">
        <div className="pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  )
}
