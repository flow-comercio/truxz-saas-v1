'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function PushRegister() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const existing = await reg.pushManager.getSubscription()
        if (existing) return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY!),
        })

        const json = sub.toJSON()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        })
      } catch {
        // Push não suportado ou negado — silencioso
      }
    }

    register()
  }, [session?.user])

  return null
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
