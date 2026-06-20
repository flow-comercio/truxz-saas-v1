const BASE_URL = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const API_KEY = process.env.ASAAS_API_KEY ?? ''

async function asaasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': API_KEY,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Asaas API error ${res.status}: ${JSON.stringify(err)}`)
  }

  return res.json() as T
}

/** Cria cliente no Asaas */
export async function criarClienteAsaas(dados: {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
}) {
  return asaasRequest<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

/** Cria cobrança PIX */
export async function criarCobrancaPix(dados: {
  customer: string   // Asaas customer ID
  value: number
  description: string
  dueDate: string    // "2024-11-20"
  externalReference?: string
}) {
  return asaasRequest<{
    id: string
    status: string
    pixQrCodeId?: string
    encodedImage?: string
    payload?: string
  }>('/payments', {
    method: 'POST',
    body: JSON.stringify({ ...dados, billingType: 'PIX' }),
  })
}

/** Busca QR Code PIX de um pagamento */
export async function buscarQrCodePix(paymentId: string) {
  return asaasRequest<{ encodedImage: string; payload: string }>(
    `/payments/${paymentId}/pixQrCode`
  )
}

/** Cria assinatura mensal (SaaS) */
export async function criarAssinaturaAsaas(dados: {
  customer: string
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX'
  value: number
  nextDueDate: string
  cycle: 'MONTHLY'
  description: string
}) {
  return asaasRequest<{ id: string; status: string }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

/** Cancela assinatura */
export async function cancelarAssinatura(subscriptionId: string) {
  return asaasRequest(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

/** Verifica status de um pagamento */
export async function statusPagamento(paymentId: string) {
  return asaasRequest<{ id: string; status: string; value: number }>(
    `/payments/${paymentId}`
  )
}
