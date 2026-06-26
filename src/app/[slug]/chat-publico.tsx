'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

const SAUDACAO = 'Olá! 👋 Posso te ajudar a encontrar o serviço ideal para seu carro e garantir sua vaga. O que você precisa?'

export default function ChatPublico({ slug, nomeLoja }: { slug: string; nomeLoja: string }) {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: SAUDACAO }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulsar, setPulsar] = useState(false)
  const [notificacao, setNotificacao] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Abre automaticamente após 8 segundos se o usuário não abriu
  useEffect(() => {
    const t1 = setTimeout(() => setPulsar(true), 3000)
    const t2 = setTimeout(() => {
      if (!aberto) setNotificacao(true)
    }, 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (aberto) {
      setNotificacao(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aberto])

  async function enviar() {
    const texto = input.trim()
    if (!texto || loading) return
    setInput('')
    const novaMsg: Msg = { role: 'user', content: texto }
    setMsgs(prev => [...prev, novaMsg])
    setLoading(true)
    try {
      const historico = msgs.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai/atendimento-publico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, mensagem: texto, historico }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta || 'Desculpe, tente novamente.' }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Ops! Tente novamente em instantes.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Janela do chat */}
      {aberto && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col"
          style={{
            width: 'min(360px, calc(100vw - 2rem))',
            height: 'min(500px, calc(100vh - 6rem))',
            background: '#12101E',
            border: '1px solid rgba(157,78,221,0.35)',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(157,78,221,0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(157,78,221,0.15)', background: 'rgba(157,78,221,0.08)', borderRadius: '20px 20px 0 0' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm leading-tight truncate">Assistente {nomeLoja}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs" style={{ color: '#A0A0B8' }}>Online agora</span>
              </div>
            </div>
            <button onClick={() => setAberto(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
              <X className="w-4 h-4" style={{ color: '#A0A0B8' }} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(157,78,221,0.3) transparent' }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className="rounded-2xl px-3 py-2 text-sm max-w-[80%]"
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)', color: '#fff', borderRadius: '16px 4px 16px 16px' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#E0E0F0', border: '1px solid rgba(157,78,221,0.15)', borderRadius: '4px 16px 16px 16px' }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}>
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px 16px 16px 16px' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#9D4EDD' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(157,78,221,0.15)' }}>
            <div className="flex gap-2 items-center p-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(157,78,221,0.2)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                placeholder="Pergunte sobre serviços, preços..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#E0E0F0' }}
              />
              <button
                onClick={enviar}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg,#9D4EDD,#7B2FBE)' }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-center text-xs mt-1.5" style={{ color: '#55556A' }}>Assistente IA — responde em segundos</p>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(o => !o)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 transition-all"
        style={{
          background: aberto ? 'rgba(157,78,221,0.2)' : 'linear-gradient(135deg,#9D4EDD,#7B2FBE)',
          border: aberto ? '1px solid rgba(157,78,221,0.4)' : 'none',
          borderRadius: aberto ? '50%' : 24,
          padding: aberto ? 12 : '12px 20px',
          boxShadow: pulsar && !aberto ? '0 0 0 0 rgba(157,78,221,0.7)' : '0 4px 20px rgba(157,78,221,0.4)',
          animation: pulsar && !aberto ? 'chatPulse 2s infinite' : 'none',
        }}
      >
        {aberto ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-black">Assistente IA</span>
          </>
        )}
        {notificacao && !aberto && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-black">1</span>
        )}
      </button>

      <style>{`
        @keyframes chatPulse {
          0% { box-shadow: 0 0 0 0 rgba(157,78,221,0.7), 0 4px 20px rgba(157,78,221,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(157,78,221,0), 0 4px 20px rgba(157,78,221,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(157,78,221,0), 0 4px 20px rgba(157,78,221,0.4); }
        }
      `}</style>
    </>
  )
}
