import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { api } from '../services/api'
import type { ChatMessage, ChatStatus } from '../types'

const WELCOME =
  '¡Hola! Soy el asistente de TOTA AAC. Puedo ayudarte con el tablero, frases, editor, perfil, entorno y más. ¿En qué te ayudo?'

export function ChatAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getChatStatus().then(setStatus).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const payload = [...messages, userMessage]

    setInput('')
    setError('')
    setMessages(payload)
    setLoading(true)

    try {
      const { reply } = await api.sendChat(payload)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar la IA')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = status
    ? status.available
      ? `Conectado (${status.provider}${status.model ? ` · ${status.model}` : ''})`
      : `Sin conexión (${status.provider})`
    : 'Verificando...'

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col lg:h-screen">
        <header className="surface border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Asistente TOTA</h1>
              <p className="text-sm text-slate-500">{statusLabel}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <div className="flex justify-start">
              <div className="surface max-w-[85%] rounded-2xl border bg-white px-4 py-3 text-sm leading-relaxed shadow-sm">
                {WELCOME}
              </div>
            </div>

            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'surface border bg-white text-slate-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="surface flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {error && (
          <p className="mx-auto mb-2 max-w-2xl px-4 text-center text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleSend} className="surface border-t px-4 py-4">
          <div className="mx-auto flex max-w-2xl gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta sobre TOTA AAC..."
              disabled={loading}
              className="flex-1 rounded-xl border px-4 py-3 text-base outline-none ring-indigo-200 focus:ring-2 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
