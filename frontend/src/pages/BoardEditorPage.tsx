import { useEffect, useRef, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ButtonVisual } from '../components/ButtonVisual'
import { api } from '../services/api'
import type { AACButton, Board } from '../types'

export function BoardEditorPage() {
  const [board, setBoard] = useState<Board | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    api
      .getDefaultBoard()
      .then(setBoard)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero'))
      .finally(() => setLoading(false))
  }, [])

  const updateButtonInState = (updated: AACButton) => {
    setBoard((prev) =>
      prev
        ? { ...prev, buttons: prev.buttons.map((b) => (b.id === updated.id ? updated : b)) }
        : prev,
    )
  }

  const handleUpdate = async (button: AACButton, field: keyof AACButton, value: string | null) => {
    try {
      const updated = await api.updateButton(button.id, { [field]: value })
      updateButtonInState(updated)
      setMessage('Cambios guardados')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleUpload = async (button: AACButton, file: File) => {
    setUploadingId(button.id)
    setMessage('')
    try {
      const result = await api.uploadButtonImage(button.id, file)
      updateButtonInState({ ...button, image_url: result.image_url })
      setMessage(`Imagen actualizada para "${button.label}"`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemoveImage = async (button: AACButton) => {
    try {
      await api.removeButtonImage(button.id)
      const updated = await api.updateButton(button.id, { image_url: null })
      updateButtonInState(updated)
      setMessage('Imagen quitada. Se usa el pictograma por defecto.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al quitar imagen')
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
        <p className="mb-2 text-slate-600">
          {board.name} · {board.buttons.length} botones
        </p>
        <p className="mb-6 text-sm text-slate-500">
          Subí una imagen por botón para que represente la acción en el tablero y en la frase.
        </p>
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

        <div className="space-y-4">
          {board.buttons.map((button) => (
            <div key={button.id} className="surface rounded-2xl border p-4">
              <div className="mb-4 flex flex-wrap items-start gap-4">
                <div
                  className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300"
                  style={{ backgroundColor: button.color }}
                >
                  <ButtonVisual
                    label={button.label}
                    spokenText={button.spoken_text}
                    icon={button.icon}
                    imageUrl={button.image_url}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{button.label}</p>
                  <p className="text-sm text-slate-500">Se habla: {button.spoken_text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileRefs.current[button.id]?.click()}
                      disabled={uploadingId === button.id}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploadingId === button.id ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {button.image_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(button)}
                        className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>
                  <input
                    ref={(el) => {
                      fileRefs.current[button.id] = el
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(button, file)
                      e.target.value = ''
                    }}
                  />
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
                  <span className="text-sm">URL de imagen (opcional)</span>
                  <input
                    defaultValue={button.image_url ?? ''}
                    placeholder="https://... o /api/uploads/..."
                    onBlur={(e) =>
                      handleUpdate(button, 'image_url', e.target.value.trim() || null)
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label className="md:col-span-3">
                  <span className="text-sm">Color de fondo</span>
                  <input
                    type="color"
                    defaultValue={button.color}
                    onChange={(e) => handleUpdate(button, 'color', e.target.value)}
                    className="mt-1 h-10 w-full max-w-xs rounded-lg border"
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
