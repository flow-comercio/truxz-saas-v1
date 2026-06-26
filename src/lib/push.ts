import webpush from 'web-push'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export async function sendPushToUser(usuarioId: string, payload: PushPayload) {
  const subs = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.usuarioId, usuarioId))

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192.png' }),
      ).catch(async (err: any) => {
        // Remove subscriptions inválidas (410 Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        }
        throw err
      })
    )
  )

  return results
}

export async function sendPushToLoja(lojaId: string, payload: PushPayload) {
  const subs = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.lojaId, lojaId))

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192.png' }),
      )
    )
  )
}
