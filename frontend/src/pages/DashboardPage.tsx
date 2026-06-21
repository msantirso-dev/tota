import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ButtonGrid } from '../components/ButtonGrid'
import { EmergencyButton } from '../components/EmergencyButton'
import { PhraseBar } from '../components/PhraseBar'
import { Toolbar } from '../components/Toolbar'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { AACButton, Board, Category, SelectedToken } from '../types'
import { buildPhrase, speakText } from '../utils/phrase'

export function DashboardPage() {
  const { profile } = useAuth()
  const [board, setBoard] = useState<Board | null>(null)
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [tokens, setTokens] = useState<SelectedToken[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getDefaultBoard()
      .then(setBoard)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero'))
      .finally(() => setLoading(false))
  }, [])

  const phrase = buildPhrase(tokens.map((t) => t.spoken))

  useEffect(() => {
    if (!phrase) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      api.getSuggestions(phrase).then((res) => setSuggestions(res.suggestions)).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [phrase])

  const visibleButtons: AACButton[] =
    board?.buttons.filter((b) =>
      activeCategory === 'all' ? true : b.category_id === activeCategory,
    ) ?? []

  const handleSelect = useCallback((button: AACButton) => {
    if (button.is_emergency) return
    setTokens((prev) => [
      ...prev,
      { buttonId: button.id, label: button.label, spoken: button.spoken_text },
    ])
  }, [])

  const handleSpeak = async () => {
    if (!phrase) return
    speakText(phrase, {
      rate: profile?.voice_rate,
      pitch: profile?.voice_pitch,
      language: profile?.language,
    })
    await api.recordHistory(phrase, tokens.map((t) => t.buttonId))
  }

  const handleClear = () => setTokens([])

  const handleSuggestionClick = (text: string) => {
    speakText(text, {
      rate: profile?.voice_rate,
      pitch: profile?.voice_pitch,
      language: profile?.language,
    })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando tablero...</div>
  }

  if (error || !board) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-8 text-center">
          <p className="mb-2 text-xl font-bold text-red-600">Tablero no disponible</p>
          <p className="mb-4 text-slate-600">{error || 'No hay tablero configurado para este usuario.'}</p>
          <p className="text-sm text-slate-500">
            Probá ingresar con <strong>usuario@tota.pit.com.ar</strong> / <strong>usuario123</strong>
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PhraseBar
        tokens={tokens}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
      />

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        <CategoryChip
          active={activeCategory === 'all'}
          label="Todos"
          onClick={() => setActiveCategory('all')}
        />
        {board?.categories.map((cat: Category) => (
          <CategoryChip
            key={cat.id}
            active={activeCategory === cat.id}
            label={cat.name}
            color={cat.color}
            onClick={() => setActiveCategory(cat.id)}
          />
        ))}
      </div>

      <ButtonGrid buttons={visibleButtons} onSelect={handleSelect} />
      <Toolbar onSpeak={handleSpeak} onClear={handleClear} disabled={!tokens.length} />
      <EmergencyButton />
    </AppLayout>
  )
}

function CategoryChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active ? 'ring-2 ring-indigo-500' : 'opacity-80'
      }`}
      style={{ backgroundColor: color ?? '#e2e8f0' }}
    >
      {label}
    </button>
  )
}
