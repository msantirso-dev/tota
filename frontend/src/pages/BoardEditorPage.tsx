import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ButtonVisual } from '../components/ButtonVisual'
import { api } from '../services/api'
import type { AACButton, Board } from '../types'

export function BoardEditorPage() {
  const [board, setBoard] = useState<Board | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getDefaultBoard()
      .then(setBoard)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (button: AACButton, field: keyof AACButton, value: string) => {
    try {
      const updated = await api.updateButton(button.id, { [field]: value })
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              buttons: prev.buttons.map((b) => (b.id === updated.id ? updated : b)),
            }
          : prev,
      )
      setMessage('Cambios guardados')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-6">Cargando editor...</div>
      </AppLayout>
    )
  }

  if (error || !board) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-8 text-center">
          <p className="mb-2 text-xl font-bold text-red-600">No se pudo abrir el editor</p>
          <p className="text-slate-600">{error || 'Tablero no encontrado'}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 pb-24">
        <h1 className="mb-2 text-2xl font-bold">Editor de tablero</h1>
        <p className="mb-6 text-slate-600">
          {board.name} · {board.buttons.length} botones · {board.categories.length} categorías
        </p>
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

        <div className="space-y-4">
          {board.buttons.map((button) => (
            <div key={button.id} className="surface rounded-2xl border p-4">
              <div className="mb-4 flex items-center gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border"
                  style={{ backgroundColor: button.color }}
                >
                  <ButtonVisual
                    label={button.label}
                    spokenText={button.spoken_text}
                    icon={button.icon}
                    imageUrl={button.image_url}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="font-semibold">{button.label}</p>
                  <p className="text-sm text-slate-500">Se habla: {button.spoken_text}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label>
                  <span className="text-sm">Etiqueta</span>
                  <input
                    defaultValue={button.label}
                    onBlur={(e) => handleUpdate(button, 'label', e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm">Frase hablada</span>
                  <input
                    defaultValue={button.spoken_text}
                    onBlur={(e) => handleUpdate(button, 'spoken_text', e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm">Color</span>
                  <input
                    type="color"
                    defaultValue={button.color}
                    onChange={(e) => handleUpdate(button, 'color', e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
