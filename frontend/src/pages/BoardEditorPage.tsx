import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { api } from '../services/api'
import type { AACButton, Board } from '../types'

export function BoardEditorPage() {
  const [board, setBoard] = useState<Board | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getDefaultBoard().then(setBoard)
  }, [])

  const handleUpdate = async (button: AACButton, field: keyof AACButton, value: string) => {
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
  }

  if (!board) return <AppLayout><div className="p-6">Cargando editor...</div></AppLayout>

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Editor de tablero</h1>
        <p className="mb-6 text-slate-600">{board.name}</p>
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

        <div className="space-y-4">
          {board.buttons.map((button) => (
            <div key={button.id} className="surface rounded-2xl border p-4">
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
