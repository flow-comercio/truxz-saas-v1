const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function deepseekChat({
  messages,
  system,
  maxTokens = 500,
  model = 'deepseek-chat',
}: {
  messages: ChatMessage[]
  system?: string
  maxTokens?: number
  model?: string
}): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY não configurada')

  const allMessages: ChatMessage[] = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
