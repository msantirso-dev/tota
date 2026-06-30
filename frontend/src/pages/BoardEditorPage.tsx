import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Star, Trash2 } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { BoardSelector } from '../components/BoardSelector'
import { ButtonVisual } from '../components/ButtonVisual'
import { api } from '../services/api'
import type { AACButton, Board, BoardSummary } from '../types'
import { normalizeBoard, sortButtons } from '../utils/board'
import { getPictogramImageUrl } from '../utils/pictograms'

const emptyButtonForm = {
  label: '',
  spoken_text: '',
  color: '#e0e7ff',
  category_id: '' as number | '',
}

export function BoardEditorPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [newBoardName, setNewBoardName] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [buttonForm, setButtonForm] = useState(emptyButtonForm)
  const [addingButton, setAddingButton] = useState(false)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const loadBoardList = useCallback(async () => {
    const list = await api.listBoards()
    setBoards(list)
    return list
  }, [])

  const loadBoard = useCallback(async (boardId: number) => {
    const data = normalizeBoard(await api.getBoard(boardId))
    setBoard(data)
    setSelectedBoardId(boardId)
    return data
  }, [])

  useEffect(() => {
    loadBoardList()
      .then(async (list) => {
        if (!list.length) {
          setError('No hay tableros disponibles')
          return
        }
        const defaultBoard = list.find((b) => b.is_default) ?? list[0]
        await loadBoard(defaultBoard.id)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [loadBoard, loadBoardList])

  const notify = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSelectBoard = async (boardId: number) => {
    setError('')
    try {
      await loadBoard(boardId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero')
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return
    try {
      const created = await api.createBoard({ name, is_default: boards.length === 0 })
      await api.createCategory({
        board_id: created.id,
        name: 'General',
        color: '#818cf8',
        sort_order: 0,
      })
      const list = await loadBoardList()
      setBoards(list)
      await loadBoard(created.id)
      setNewBoardName('')
      setShowNewBoard(false)
      notify(`Tablero "${name}" creado`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tablero')
    }
  }

  const handleDeleteBoard = async () => {
    if (!board) return
    if (!window.confirm(`¿Eliminar el tablero "${board.name}" y todos sus botones?`)) return
    try {
      await api.deleteBoard(board.id)
      const list = await loadBoardList()
      if (!list.length) {
        setBoard(null)
        setSelectedBoardId(null)
        setError('No quedan tableros. Creá uno nuevo.')
        return
      }
      const next = list.find((b) => b.is_default) ?? list[0]
      await loadBoard(next.id)
      notify('Tablero eliminado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tablero')
    }
  }

  const handleSetDefault = async () => {
    if (!board) return
    try {
      await api.updateBoard(board.id, { is_default: true })
      const list = await loadBoardList()
      setBoards(list)
      notify('Tablero marcado como predeterminado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tablero')
    }
  }

  const handleRenameBoard = async (name: string) => {
    if (!board || !name.trim() || name.trim() === board.name) return
    try {
      await api.updateBoard(board.id, { name: name.trim() })
      const list = await loadBoardList()
      setBoards(list)
      setBoard((prev) => (prev ? { ...prev, name: name.trim() } : prev))
      notify('Nombre actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al renombrar')
    }
  }

  const updateButtonInState = (updated: AACButton) => {
    setBoard((prev) =>
      prev
        ? normalizeBoard({
            ...prev,
            buttons: prev.buttons.map((b) => (b.id === updated.id ? updated : b)),
          })
        : prev,
    )
  }

  const handleUpdate = async (button: AACButton, field: keyof AACButton, value: string | number | null) => {
    try {
      const updated = await api.updateButton(button.id, { [field]: value })
      updateButtonInState(updated)
      notify('Cambios guardados')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleAddButton = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!board) return
    const label = buttonForm.label.trim()
    const spoken = buttonForm.spoken_text.trim() || label
    if (!label) return

    setAddingButton(true)
    try {
      const nextOrder = board.buttons.length
      const imageUrl = getPictogramImageUrl(label, spoken)
      const created = await api.createButton({
        board_id: board.id,
        label,
        spoken_text: spoken,
        color: buttonForm.color,
        category_id: buttonForm.category_id || board.categories[0]?.id || null,
        sort_order: nextOrder,
        image_url: imageUrl,
      })
      setBoard((prev) =>
        prev ? normalizeBoard({ ...prev, buttons: [...prev.buttons, created] }) : prev,
      )
      setButtonForm(emptyButtonForm)
      notify(`Botón "${label}" agregado`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear botón')
    } finally {
      setAddingButton(false)
    }
  }

  const handleDeleteButton = async (button: AACButton) => {
    if (!board) return
    if (!window.confirm(`¿Eliminar el botón "${button.label}"?`)) return
    try {
      await api.deleteButton(button.id)
      setBoard((prev) =>
        prev
          ? normalizeBoard({ ...prev, buttons: prev.buttons.filter((b) => b.id !== button.id) })
          : prev,
      )
      notify('Botón eliminado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar botón')
    }
  }

  const handleMoveButton = async (buttonId: number, direction: 'up' | 'down') => {
    if (!board) return
    const sorted = sortButtons(board.buttons)
    const idx = sorted.findIndex((b) => b.id === buttonId)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return

    const reordered = [...sorted]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]

    try {
      await api.reorderButtons(
        board.id,
        reordered.map((b) => b.id),
      )
      setBoard((prev) =>
        prev
          ? normalizeBoard({
              ...prev,
              buttons: reordered.map((b, i) => ({ ...b, sort_order: i })),
            })
          : prev,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar')
    }
  }

  const handleUpload = async (button: AACButton, file: File) => {
    setUploadingId(button.id)
    try {
      const result = await api.uploadButtonImage(button.id, file)
      updateButtonInState({ ...button, image_url: result.image_url })
      notify(`Imagen actualizada para "${button.label}"`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemoveImage = async (button: AACButton) => {
    try {
      await api.removeButtonImage(button.id)
      const updated = await api.updateButton(button.id, { image_url: null })
      updateButtonInState(updated)
      notify('Imagen quitada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar imagen')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-6">Cargando editor...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Editor de tableros</h1>
            <p className="text-sm text-slate-500">
              Gestioná tableros, ordená botones y personalizá cada acción AAC.
            </p>
          </div>
          <BoardSelector
            boards={boards}
            selectedId={selectedBoardId}
            onChange={handleSelectBoard}
          />
        </div>

        {error && <p className="mb-4 text-red-600">{error}</p>}
        {message && <p className="mb-4 text-green-600">{message}</p>}

        {!board ? (
          <div className="surface rounded-2xl border p-8 text-center">
            <p className="mb-4 text-slate-600">Creá tu primer tablero para empezar.</p>
            <button
              onClick={() => setShowNewBoard(true)}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
            >
              Nuevo tablero
            </button>
          </div>
        ) : (
          <>
            <section className="surface mb-6 rounded-2xl border p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[200px] flex-1">
                  <span className="text-sm">Nombre del tablero</span>
                  <input
                    defaultValue={board.name}
                    onBlur={(e) => handleRenameBoard(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                {!board.is_default && (
                  <button
                    type="button"
                    onClick={handleSetDefault}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    <Star size={16} />
                    Marcar predeterminado
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNewBoard((v) => !v)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                  + Nuevo tablero
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBoard}
                  className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Eliminar tablero
                </button>
              </div>
            </section>

            {showNewBoard && (
              <form
                onSubmit={handleCreateBoard}
                className="surface mb-6 flex flex-wrap items-end gap-3 rounded-2xl border p-4"
              >
                <label className="min-w-[200px] flex-1">
                  <span className="text-sm">Nombre del nuevo tablero</span>
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Ej: Tablero escuela"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-white">
                  Crear
                </button>
              </form>
            )}

            <section className="surface mb-8 rounded-2xl border p-4">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Plus size={18} />
                Agregar botón
              </h2>
              <form onSubmit={handleAddButton} className="grid gap-3 md:grid-cols-4">
                <label>
                  <span className="text-sm">Etiqueta</span>
                  <input
                    required
                    value={buttonForm.label}
                    onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm">Frase hablada</span>
                  <input
                    value={buttonForm.spoken_text}
                    onChange={(e) => setButtonForm({ ...buttonForm, spoken_text: e.target.value })}
                    placeholder="Igual que etiqueta si vacío"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-sm">Categoría</span>
                  <select
                    value={buttonForm.category_id}
                    onChange={(e) =>
                      setButtonForm({
                        ...buttonForm,
                        category_id: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="">Sin categoría</option>
                    {board.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-sm">Color</span>
                  <input
                    type="color"
                    value={buttonForm.color}
                    onChange={(e) => setButtonForm({ ...buttonForm, color: e.target.value })}
                    className="mt-1 h-10 w-full rounded-lg border"
                  />
                </label>
                <div className="md:col-span-4">
                  <button
                    type="submit"
                    disabled={addingButton}
                    className="rounded-xl bg-indigo-600 px-6 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    {addingButton ? 'Agregando...' : 'Agregar botón'}
                  </button>
                </div>
              </form>
            </section>

            <p className="mb-4 text-sm text-slate-500">
              {board.buttons.length} botones · usá ↑ ↓ para ordenar
            </p>

            <div className="space-y-4">
              {sortButtons(board.buttons).map((button, index, arr) => (
                <div key={button.id} className="surface rounded-2xl border p-4">
                  <div className="mb-4 flex flex-wrap items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveButton(button.id, 'up')}
                        className="rounded border p-1 disabled:opacity-30"
                        aria-label="Subir"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={index === arr.length - 1}
                        onClick={() => handleMoveButton(button.id, 'down')}
                        className="rounded border p-1 disabled:opacity-30"
                        aria-label="Bajar"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

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
                      <p className="font-semibold">
                        #{index + 1} · {button.label}
                      </p>
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
                        <button
                          type="button"
                          onClick={() => handleDeleteButton(button)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
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
                      <span className="text-sm">Categoría</span>
                      <select
                        defaultValue={button.category_id ?? ''}
                        onChange={(e) =>
                          handleUpdate(
                            button,
                            'category_id',
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="mt-1 w-full rounded-lg border px-3 py-2"
                      >
                        <option value="">Sin categoría</option>
                        {board.categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
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
                    <label className="md:col-span-2">
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

              {!board.buttons.length && (
                <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                  Este tablero no tiene botones. Agregá uno arriba.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
