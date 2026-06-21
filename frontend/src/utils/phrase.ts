const CONNECTORS: Record<string, string> = {
  casa: 'a casa',
  baño: 'al baño',
  mamá: 'con mamá',
  papá: 'con papá',
}

let voicesCache: SpeechSynthesisVoice[] = []
let voicesListenerAttached = false

function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  voicesCache = window.speechSynthesis.getVoices()
  return voicesCache
}

function ensureVoicesListener() {
  if (voicesListenerAttached || !('speechSynthesis' in window)) return
  voicesListenerAttached = true
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

function pickVoice(language: string): SpeechSynthesisVoice | undefined {
  const voices = voicesCache.length ? voicesCache : loadVoices()
  const lang = language.toLowerCase()
  return (
    voices.find((v) => v.lang.toLowerCase() === lang) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.split('-')[0])) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('es')) ||
    voices[0]
  )
}

/** iOS/Safari exige una interacción previa; llamar en el primer toque del tablero. */
export function unlockSpeech(): void {
  if (!('speechSynthesis' in window)) return
  ensureVoicesListener()
  window.speechSynthesis.resume()
  const utterance = new SpeechSynthesisUtterance(' ')
  utterance.volume = 0.01
  window.speechSynthesis.speak(utterance)
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

  ensureVoicesListener()
  window.speechSynthesis.resume()

  const language = options.language || 'es-AR'
  const runSpeak = () => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(language)
    if (voice) utterance.voice = voice
    utterance.lang = language
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    window.speechSynthesis.speak(utterance)
  }

  // iOS cancela el siguiente speak si es inmediato; Android a veces también.
  if (isIOS() || isMobileDevice()) {
    window.speechSynthesis.cancel()
    setTimeout(runSpeak, 120)
  } else {
    runSpeak()
  }
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}
