const store = new Map<string, number[]>()
let lastCleanup = Date.now()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  // Purge entradas expiradas a cada 10 minutos para evitar vazamento de memória
  if (now - lastCleanup > 10 * 60 * 1000) {
    for (const [k, ts] of store) {
      const active = ts.filter(t => t > windowStart)
      if (active.length === 0) store.delete(k)
      else store.set(k, active)
    }
    lastCleanup = now
  }

  const timestamps = (store.get(key) ?? []).filter(t => t > windowStart)
  if (timestamps.length >= maxRequests) return false
  timestamps.push(now)
  store.set(key, timestamps)
  return true
}

export type HistoricoMsg = { role: 'user' | 'assistant'; content: string }

// Sanitiza o histórico removendo qualquer mensagem com role inválido (bloqueia prompt injection via role:system)
export function sanitizeHistorico(raw: unknown): HistoricoMsg[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(item => {
      if (typeof item !== 'object' || item === null) return false
      const m = item as Record<string, unknown>
      return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    })
    .map(item => {
      const m = item as Record<string, unknown>
      return {
        role: m.role as 'user' | 'assistant',
        content: (m.content as string).slice(0, 1000),
      }
    })
}
