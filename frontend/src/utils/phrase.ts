import { unlockMediaAudio } from './audio'

const CONNECTORS: Record<string, string> = {
  casa: 'a casa',
  baño: 'al baño',
  mamá: 'con mamá',
  papá: 'con papá',
}

let voicesCache: SpeechSynthesisVoice[] = []
let voicesListenerAttached = false

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
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

function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  const current = loadVoices()
  if (current.length) return Promise.resolve(current)
  if (!('speechSynthesis' in window)) return Promise.resolve([])

  return new Promise((resolve) => {
    const finish = () => resolve(loadVoices())
    const timer = window.setTimeout(finish, timeoutMs)
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        window.clearTimeout(timer)
        finish()
      },
      { once: true },
    )
  })
}

/** iOS/Android: interacción previa; desbloquea TTS y reproducción de audio Piper. */
export function unlockSpeech(): void {
  if (!('speechSynthesis' in window)) {
    unlockMediaAudio()
    return
  }
  ensureVoicesListener()
  unlockMediaAudio()
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
  unlockMediaAudio()
  window.speechSynthesis.resume()

  const language = options.language || 'es-AR'

  const runSpeak = (voices: SpeechSynthesisVoice[]) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const lang = language.toLowerCase()
    const voice =
      voices.find((v) => v.lang.toLowerCase() === lang) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.split('-')[0])) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es')) ||
      voices[0]
    if (voice) utterance.voice = voice
    utterance.lang = language
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    window.speechSynthesis.speak(utterance)
  }

  const delay = isIOS() ? 120 : isAndroid() ? 200 : 0

  void waitForVoices().then((voices) => {
    if (delay > 0) {
      window.speechSynthesis.cancel()
      window.setTimeout(() => runSpeak(voices), delay)
    } else {
      runSpeak(voices)
    }
  })
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}
