import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AACButton } from '../types'

interface ButtonGridProps {
  buttons: AACButton[]
  onSelect: (button: AACButton) => void
}

function iconFromName(name: string): LucideIcon | null {
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  const icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[pascal]
  return icon ?? null
}

export function ButtonGrid({ buttons, onSelect }: ButtonGridProps) {
  if (!buttons.length) {
    return (
      <div className="mx-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No hay botones en este tablero. Probá con el usuario demo o contactá al administrador.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {buttons.map((button) => {
        const Icon = button.icon ? iconFromName(button.icon) : null
        return (
          <button
            key={button.id}
            onClick={() => onSelect(button)}
            className={`aac-button min-h-[6.5rem] ${button.is_emergency ? 'border-red-500 bg-red-100 high-contrast:bg-red-900' : ''}`}
            style={{ backgroundColor: button.is_emergency ? undefined : button.color }}
            aria-label={button.label}
          >
            {Icon && (
              <Icon
                size={36}
                strokeWidth={2.2}
                className="mb-2 shrink-0 opacity-90"
                aria-hidden
              />
            )}
            {button.image_url ? (
              <img
                src={button.image_url}
                alt=""
                className="mb-2 h-12 w-12 object-contain"
              />
            ) : null}
            <span className="text-aac-lg font-bold leading-tight">{button.label}</span>
          </button>
        )
      })}
    </div>
  )
}
