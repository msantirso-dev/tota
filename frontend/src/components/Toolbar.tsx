import { Eraser, Volume2 } from 'lucide-react'

interface ToolbarProps {
  onSpeak: () => void
  onClear: () => void
  disabled: boolean
}

export function Toolbar({ onSpeak, onClear, disabled }: ToolbarProps) {
  return (
    <div className="surface flex flex-wrap gap-3 border-t p-3 sm:p-4 md:sticky md:bottom-0 md:z-10">
      <button
        onClick={onSpeak}
        disabled={disabled}
        className="aac-toolbar-btn flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 high-contrast:bg-yellow-300 high-contrast:text-black"
      >
        <Volume2 className="mr-2" size={22} />
        Hablar
      </button>
      <button
        onClick={onClear}
        disabled={disabled}
        className="aac-toolbar-btn bg-slate-200 text-slate-800 hover:bg-slate-300 disabled:opacity-40 high-contrast:bg-white high-contrast:text-black"
      >
        <Eraser className="mr-2" size={22} />
        Borrar
      </button>
    </div>
  )
}
