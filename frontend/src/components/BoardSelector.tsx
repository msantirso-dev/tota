import type { BoardSummary } from '../types'

interface BoardSelectorProps {
  boards: BoardSummary[]
  selectedId: number | null
  onChange: (boardId: number) => void
  className?: string
}

export function BoardSelector({ boards, selectedId, onChange, className = '' }: BoardSelectorProps) {
  if (boards.length <= 1) {
    const board = boards[0]
    if (!board) return null
    return (
      <p className={`text-sm text-slate-600 ${className}`}>
        Tablero: <span className="font-semibold">{board.name}</span>
        {board.is_default && <span className="ml-2 text-xs text-indigo-600">(predeterminado)</span>}
      </p>
    )
  }

  return (
    <label className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-slate-600">Tablero:</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border px-3 py-2 text-sm"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
            {board.is_default ? ' ★' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
