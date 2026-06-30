import type { Profile, TtsPreferences } from '../types'
import { api } from '../services/api'
import { speakText, unlockSpeech } from './phrase'

export function getTtsPreferences(profile: Profile | null | undefined): Required<TtsPreferences> {
  const prefs = profile?.preferences ?? {}
  return {
    tts_mode: prefs.tts_mode === 'piper' ? 'piper' : 'browser',
    piper_url: typeof prefs.piper_url === 'string' ? prefs.piper_url : '',
  }
}

function voiceOptions(profile: Profile | null | undefined) {
  return {
    rate: profile?.voice_rate,
    pitch: profile?.voice_pitch,
    language: profile?.language,
  }
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: contentType })
}

async function playBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  try {
    const audio = new Audio(url)
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('No se pudo reproducir el audio'))
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function playBase64(base64: string, contentType: string): Promise<void> {
  await playBlob(base64ToBlob(base64, contentType))
}

async function tryPiperDirect(piperUrl: string, text: string, language: string): Promise<boolean> {
  const base = piperUrl.replace(/\/$/, '')
  const endpoints = [`${base}/synthesize`, `${base}/api/tts`, base]

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })
      if (!resp.ok) continue

      const contentType = resp.headers.get('content-type') ?? ''
      if (contentType.includes('audio')) {
        await playBlob(await resp.blob())
        return true
      }

      const data = (await resp.json()) as { audio_base64?: string; audio_content_type?: string }
      if (data.audio_base64) {
        await playBase64(data.audio_base64, data.audio_content_type ?? 'audio/wav')
        return true
      }
    } catch {
      // CORS o servidor inaccesible desde el navegador
    }
  }
  return false
}

async function tryPiperViaBackend(
  text: string,
  piperUrl: string | undefined,
  language: string,
): Promise<boolean> {
  const result = await api.synthesizeTts(text, {
    provider: 'piper',
    language,
    ...(piperUrl?.trim() ? { piper_url: piperUrl.trim() } : {}),
  })

  if (result.audio_base64) {
    await playBase64(result.audio_base64, result.audio_content_type ?? 'audio/wav')
    return true
  }

  if (result.use_browser) return false
  return false
}

/** Reproduce texto con la voz configurada en el perfil (navegador o Piper). */
export async function speakWithProfile(text: string, profile: Profile | null | undefined) {
  if (!text) return

  unlockSpeech()
  const prefs = getTtsPreferences(profile)
  const language = profile?.language ?? 'es-AR'

  if (prefs.tts_mode === 'piper') {
    const piperUrl = prefs.piper_url.trim()

    if (piperUrl) {
      try {
        const direct = await tryPiperDirect(piperUrl, text, language)
        if (direct) return
      } catch {
        // fallback abajo
      }
    }

    try {
      const viaBackend = await tryPiperViaBackend(text, piperUrl || undefined, language)
      if (viaBackend) return
    } catch {
      // fallback abajo
    }
  }

  speakText(text, voiceOptions(profile))
}

export async function testPiperVoice(
  piperUrl: string,
  profile: Profile | null | undefined,
  sample = 'Hola, probando la voz de Piper',
) {
  unlockSpeech()
  const language = profile?.language ?? 'es-AR'
  const url = piperUrl.trim()

  if (url) {
    const direct = await tryPiperDirect(url, sample, language)
    if (direct) return { ok: true, source: 'direct' as const }

    const result = await api.testPiper(url, sample)
    if (result.audio_base64) {
      await playBase64(result.audio_base64, result.audio_content_type ?? 'audio/wav')
      return { ok: true, source: 'backend' as const }
    }
  } else {
    const viaBackend = await tryPiperViaBackend(sample, undefined, language)
    if (viaBackend) return { ok: true, source: 'backend' as const }
  }

  speakText(sample, voiceOptions(profile))
  return { ok: true, source: 'browser_fallback' as const }
}
