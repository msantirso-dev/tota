import { useCallback, useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { BoardSelector } from '../components/BoardSelector'
import { ButtonGrid } from '../components/ButtonGrid'
import { EmergencyButton } from '../components/EmergencyButton'
import { PhraseBar } from '../components/PhraseBar'
import { Toolbar } from '../components/Toolbar'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { AACButton, Board, BoardSummary, Category, SelectedToken } from '../types'
import { BOARD_STORAGE_KEY, normalizeBoard, sortButtons } from '../utils/board'
import { buildPhrase, speakText, unlockSpeech } from '../utils/phrase'

export function DashboardPage() {
  const { profile } = useAuth()
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [tokens, setTokens] = useState<SelectedToken[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBoard = useCallback(async (boardId: number) => {
    const data = normalizeBoard(await api.getBoard(boardId))
    setBoard(data)
    setSelectedBoardId(boardId)
    localStorage.setItem(BOARD_STORAGE_KEY, String(boardId))
    setActiveCategory('all')
    setTokens([])
  }, [])

  useEffect(() => {
    api
      .listBoards()
      .then(async (list) => {
        setBoards(list)
        if (!list.length) {
          setError('No hay tableros disponibles')
          return
        }
        const stored = localStorage.getItem(BOARD_STORAGE_KEY)
        const storedId = stored ? Number(stored) : null
        const target =
          (storedId && list.some((b) => b.id === storedId) && storedId) ||
          list.find((b) => b.is_default)?.id ||
          list[0].id
        await loadBoard(target)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero'))
      .finally(() => setLoading(false))
  }, [loadBoard])

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

  const visibleButtons: AACButton[] = sortButtons(
    board?.buttons.filter((b) =>
      activeCategory === 'all' ? true : b.category_id === activeCategory,
    ) ?? [],
  )

  const handleSelect = useCallback(
    (button: AACButton) => {
      if (button.is_emergency) return
      unlockSpeech()
      speakText(button.spoken_text, {
        rate: profile?.voice_rate,
        pitch: profile?.voice_pitch,
        language: profile?.language,
      })
      setTokens((prev) => [
        ...prev,
        {
          buttonId: button.id,
          label: button.label,
          spoken: button.spoken_text,
          imageUrl: button.image_url,
        },
      ])
    },
    [profile],
  )

  const handleSpeak = async () => {
    if (!phrase) return
    unlockSpeech()
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

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <BoardSelector
          boards={boards}
          selectedId={selectedBoardId}
          onChange={(id) => {
            loadBoard(id).catch((err) =>
              setError(err instanceof Error ? err.message : 'No se pudo cambiar de tablero'),
            )
          }}
        />
        {board && (
          <p className="text-xs text-slate-500">
            {board.buttons.length} botones · {board.categories.length} categorías
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-3">
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
      className={`rounded-full px-4 py-2.5 text-sm font-medium md:px-5 md:py-3 md:text-base ${
        active ? 'ring-2 ring-indigo-500' : 'opacity-80'
      }`}
      style={{ backgroundColor: color ?? '#e2e8f0' }}
    >
      {label}
    </button>
  )
}
