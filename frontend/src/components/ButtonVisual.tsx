import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getPictogram, getPictogramImageUrl } from '../utils/pictograms'
import { api } from '../services/api'

interface ButtonVisualProps {
  label: string
  spokenText?: string
  icon?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'lg'
}

function iconFromName(name: string): LucideIcon | null {
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[pascal] ?? null
}

export function ButtonVisual({ label, spokenText, icon, imageUrl, size = 'lg' }: ButtonVisualProps) {
  const pictogram = getPictogram(label, spokenText)
  const pictogramImage = getPictogramImageUrl(label, spokenText)
  const resolvedImage = imageUrl ?? pictogramImage
  const Icon = icon ? iconFromName(icon) : null
  const emojiSize = size === 'lg' ? 'text-5xl' : 'text-3xl'
  const iconSize = size === 'lg' ? 40 : 28
  const imageSize = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'

  if (resolvedImage) {
    return (
      <img
        src={api.resolveMediaUrl(resolvedImage) ?? resolvedImage}
        alt=""
        className={`mb-1 ${imageSize} object-contain`}
      />
    )
  }

  if (pictogram) {
    return (
      <span className={`mb-2 leading-none ${emojiSize}`} aria-hidden>
        {pictogram}
      </span>
    )
  }

  if (Icon) {
    return <Icon size={iconSize} strokeWidth={2.2} className="mb-2 shrink-0 opacity-90" aria-hidden />
  }

  return (
    <span
      className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/60 font-bold ${size === 'lg' ? 'text-xl' : 'text-base'}`}
      aria-hidden
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}
