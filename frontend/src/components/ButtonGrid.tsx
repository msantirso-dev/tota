import type { AACButton } from '../types'
import { ButtonVisual } from './ButtonVisual'

interface ButtonGridProps {
  buttons: AACButton[]
  onSelect: (button: AACButton) => void
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
    <div className="grid grid-cols-2 gap-3 p-3 xs:grid-cols-2 sm:grid-cols-3 sm:gap-4 sm:p-4 md:grid-cols-4 md:gap-4 md:p-5 lg:grid-cols-5 lg:gap-5 lg:p-6 xl:grid-cols-6">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onSelect(button)}
          className={`aac-button ${button.is_emergency ? 'border-red-500 bg-red-100 high-contrast:bg-red-900' : ''}`}
          style={{ backgroundColor: button.is_emergency ? undefined : button.color }}
          aria-label={button.label}
        >
          <ButtonVisual
            label={button.label}
            spokenText={button.spoken_text}
            icon={button.icon}
            imageUrl={button.image_url}
            size="lg"
          />
          <span className="mt-1 text-aac-lg font-bold leading-tight md:text-aac-xl">{button.label}</span>
        </button>
      ))}
    </div>
  )
}
