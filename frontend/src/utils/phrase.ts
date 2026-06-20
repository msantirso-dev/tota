const CONNECTORS: Record<string, string> = {
  casa: 'a casa',
  baño: 'al baño',
  mamá: 'con mamá',
  papá: 'con papá',
}

export function buildPhrase(tokens: string[]): string {
  if (!tokens.length) return ''
  const parts = tokens.map((token) => CONNECTORS[token.toLowerCase()] ?? token)
  const result = parts.join(' ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export function speakText(
  text: string,
  options: { rate?: number; pitch?: number; language?: string } = {},
) {
  if (!text || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.language || 'es-AR'
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? 1
  window.speechSynthesis.speak(utterance)
}
