import { buildPhrase } from '../utils/phrase'
import { getPictogram, getPictogramImageUrl } from '../utils/pictograms'
import { api } from '../services/api'
import type { SelectedToken } from '../types'

interface PhraseBarProps {
  tokens: SelectedToken[]
  suggestions: string[]
  onSuggestionClick: (phrase: string) => void
}

export function PhraseBar({ tokens, suggestions, onSuggestionClick }: PhraseBarProps) {
  const phrase = buildPhrase(tokens.map((t) => t.spoken))

  return (
    <section className="surface sticky top-0 z-10 border-b p-3 shadow-sm sm:p-4 md:p-5">
      {tokens.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tokens.map((token) => {
            const tokenImage =
              token.imageUrl ?? getPictogramImageUrl(token.label, token.spoken)
            return (
            <div
              key={`${token.buttonId}-${token.label}`}
              className="flex flex-col items-center rounded-xl border bg-white px-2 py-1.5 shadow-sm md:px-3 md:py-2"
            >
              {tokenImage ? (
                <img
                  src={api.resolveMediaUrl(tokenImage) ?? tokenImage}
                  alt=""
                  className="h-10 w-10 object-contain md:h-14 md:w-14"
                />
              ) : getPictogram(token.label, token.spoken) ? (
                <span className="flex h-10 w-10 items-center justify-center text-2xl" aria-hidden>
                  {getPictogram(token.label, token.spoken)}
                </span>
              ) : (
                <span className="flex h-10 w-10 items-center justify-center text-lg font-bold">
                  {token.label.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-xs opacity-70">{token.label}</span>
            </div>
            )
          })}
        </div>
      )}

      <div className="mb-3 min-h-[3.5rem] rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 px-3 py-3 text-xl font-semibold sm:min-h-[4rem] sm:px-4 sm:text-aac-2xl md:min-h-[5rem] md:text-aac-3xl high-contrast:border-yellow-300 high-contrast:bg-black">
        {phrase || 'Tocá los botones para armar una frase...'}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 md:px-5 md:py-3 md:text-base high-contrast:bg-black high-contrast:ring-yellow-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
