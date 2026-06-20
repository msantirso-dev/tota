import type { AACButton } from '../types'

interface ButtonGridProps {
  buttons: AACButton[]
  onSelect: (button: AACButton) => void
}

export function ButtonGrid({ buttons, onSelect }: ButtonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onSelect(button)}
          className={`aac-button ${button.is_emergency ? 'border-red-500 bg-red-100 high-contrast:bg-red-900' : ''}`}
          style={{ backgroundColor: button.is_emergency ? undefined : button.color }}
          aria-label={button.label}
        >
          <span className="text-aac-xl font-bold">{button.label}</span>
          {button.icon && <span className="mt-1 text-xs opacity-60">{button.icon}</span>}
        </button>
      ))}
    </div>
  )
}
