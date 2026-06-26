'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  back?: boolean
  right?: React.ReactNode
}

export function PageHeader({ title, back = false, right }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-30 glass-strong safe-top"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="h-14 flex items-center gap-2 px-4">
        {back && (
          <button onClick={() => router.back()}
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-xl active:scale-90 transition-transform">
            <ChevronLeft className="w-6 h-6 text-brand" />
          </button>
        )}
        <h1 className="font-black text-lg text-white tracking-tight flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}
