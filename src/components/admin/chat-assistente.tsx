'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Qual meu serviço mais rentável?',
  'Clientes sem vir há 60 dias',
  'Estoque crítico agora',
  'Receita vs mês anterior',
]

export function ChatAssistente() {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function enviar(texto?: string) {
    const mensagem = texto ?? input.trim()
    if (!mensagem || loading) return
    setInput('')
    const novaMsg: Msg = { role: 'user', content: mensagem }
    setMsgs(prev => [...prev, novaMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistente', {
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
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-40 transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)', boxShadow: '0 0 30px rgba(157,78,221,0.5)' }}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Chat panel */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAberto(false)} />
          <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl flex flex-col"
            style={{ background: '#0F0D1F', border: '1px solid rgba(157,78,221,0.3)' }}>

            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(157,78,221,0.2)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Assistente TRUXZ</p>
                <p className="text-xs" style={{ color: '#9D4EDD' }}>IA com dados reais do seu negócio</p>
              </div>
              <button onClick={() => setAberto(false)} className="ml-auto p-1.5 rounded-lg"
                style={{ color: '#55556A' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.length === 0 && (
                <div>
                  <p className="text-center text-sm mb-4" style={{ color: '#55556A' }}>
                    Pergunte sobre seu negócio
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGESTOES.map(s => (
                      <button key={s} onClick={() => enviar(s)}
                        className="text-left text-xs p-3 rounded-xl transition-all font-medium"
                        style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)', color: '#C77DFF' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
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
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#9D4EDD' }} />
                    <span className="text-xs" style={{ color: '#A0A0B8' }}>Analisando...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: 'rgba(157,78,221,0.15)' }}>
              <div className="flex gap-2">
                <input
                  className="flex-1 input text-sm"
                  placeholder="Pergunte sobre seu negócio..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                  disabled={loading}
                />
                <button
                  onClick={() => enviar()}
                  disabled={!input.trim() || loading}
                  className="p-3 rounded-xl transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #9D4EDD, #7B2FBE)' }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
