'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

export function ChatAtendimento() {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: 'Olá! Posso te ajudar com dúvidas sobre serviços, preços ou horários. 😊' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function enviar() {
    const mensagem = input.trim()
    if (!mensagem || loading) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', content: mensagem }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/atendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem,
          historico: msgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui responder agora. Entre em contato diretamente com a loja.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-24 right-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl z-40"
        style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)', boxShadow: '0 0 20px rgba(157,78,221,0.4)' }}>
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0D0B1E' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'rgba(157,78,221,0.15)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(157,78,221,0.2)', border: '1px solid rgba(157,78,221,0.4)' }}>
              <MessageCircle className="w-5 h-5" style={{ color: '#9D4EDD' }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Assistente Virtual</p>
              <p className="text-xs" style={{ color: '#9D4EDD' }}>Online agora</p>
            </div>
            <button onClick={() => setAberto(false)} className="ml-auto p-2">
              <X className="w-5 h-5" style={{ color: '#55556A' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 text-sm leading-relaxed"
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)', color: 'white', borderRadius: '18px 18px 4px 18px' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#E0E0F0', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(255,255,255,0.08)' }
                  }>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#9D4EDD' }} />
                  <span className="text-xs" style={{ color: '#A0A0B8' }}>digitando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t" style={{ borderColor: 'rgba(157,78,221,0.15)' }}>
            <div className="flex gap-2">
              <input
                className="flex-1 input text-sm"
                placeholder="Sua dúvida..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                disabled={loading}
              />
              <button onClick={enviar} disabled={!input.trim() || loading}
                className="p-3 rounded-xl disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
