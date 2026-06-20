import { buildPhrase } from '../utils/phrase'
import type { SelectedToken } from '../types'

interface PhraseBarProps {
  tokens: SelectedToken[]
  suggestions: string[]
  onSuggestionClick: (phrase: string) => void
}

export function PhraseBar({ tokens, suggestions, onSuggestionClick }: PhraseBarProps) {
  const phrase = buildPhrase(tokens.map((t) => t.spoken))

  return (
    <section className="surface sticky top-0 z-10 border-b p-4 shadow-sm">
      <div className="mb-3 min-h-[4rem] rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-3 text-aac-2xl font-semibold high-contrast:border-yellow-300 high-contrast:bg-black">
        {phrase || 'Tocá los botones para armar una frase...'}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 high-contrast:bg-black high-contrast:ring-yellow-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
