const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '127', '0.0.0.0'])

/** Solo hostname Docker (sin http://, sin puerto). */
export function normalizePiperHost(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const parsed = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(`http://${trimmed.split('/')[0]}`)
    const host = parsed.hostname.toLowerCase()
    if (LOCAL_HOSTS.has(host)) return ''
    return parsed.hostname
  } catch {
    const host = trimmed.split('/')[0].split(':')[0].toLowerCase()
    if (!host || LOCAL_HOSTS.has(host)) return ''
    return trimmed.split('/')[0].split(':')[0]
  }
}

export function isInvalidPiperHostInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes('://') || trimmed.includes(':5000') || trimmed.includes(':10200')) {
    return true
  }
  const normalized = normalizePiperHost(trimmed)
  return trimmed.length > 0 && !normalized
}

export function piperHostInputHint(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.includes('127.0.0.1') || trimmed.includes('localhost')) {
    return '127.0.0.1 es el backend TOTA, no Piper. Ejecutá hostname en la Terminal de Piper.'
  }
  if (trimmed.includes('://') || /:\d{2,5}/.test(trimmed)) {
    return 'Solo el nombre del contenedor, sin http:// ni puerto (ej. piper-tts).'
  }
  return null
}
