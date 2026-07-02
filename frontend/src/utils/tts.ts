import type { Profile, TtsPreferences } from '../types'
import { api } from '../services/api'
import { speakText, unlockSpeech } from './phrase'

const INTERNAL_DOCKER_HOSTS = new Set(['piper', 'piper-tts', 'localhost', '127.0.0.1'])

export function getTtsPreferences(profile: Profile | null | undefined): Required<TtsPreferences> {
  const prefs = profile?.preferences ?? {}
  return {
    tts_mode: prefs.tts_mode === 'piper' ? 'piper' : 'browser',
    piper_url: typeof prefs.piper_url === 'string' ? prefs.piper_url : '',
    piper_host: typeof prefs.piper_host === 'string' ? prefs.piper_host : '',
    piper_voice: typeof prefs.piper_voice === 'string' ? prefs.piper_voice : '',
  }
}

function isPublicPiperUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const hostname = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`).hostname
    return !INTERNAL_DOCKER_HOSTS.has(hostname.toLowerCase())
  } catch {
    return false
  }
}

/** URL para el backend: hostnames Docker internos se ignoran (usa env del servidor). */
export function piperUrlForBackend(piperUrl: string): string | undefined {
  const trimmed = piperUrl.trim()
  if (!trimmed || !isPublicPiperUrl(trimmed)) return undefined
  return trimmed
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
  const endpoints = [base, `${base}/synthesize`, `${base}/v1/audio/speech`, `${base}/api/tts`]

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, input: text }),
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
  piperVoice?: string,
  piperHost?: string,
): Promise<boolean> {
  const result = await api.synthesizeTts(text, {
    provider: 'piper',
    language,
    ...(piperUrl ? { piper_url: piperUrl } : {}),
    ...(piperHost ? { piper_host: piperHost } : {}),
    ...(piperVoice ? { piper_voice: piperVoice } : {}),
  })

  if (result.use_browser || !result.audio_base64) return false

  await playBase64(result.audio_base64, result.audio_content_type ?? 'audio/wav')
  return true
}

/** Reproduce texto con la voz configurada en el perfil (navegador o Piper). */
export async function speakWithProfile(text: string, profile: Profile | null | undefined) {
  if (!text) return

  unlockSpeech()
  const prefs = getTtsPreferences(profile)
  const language = profile?.language ?? 'es-AR'

  if (prefs.tts_mode === 'piper') {
    const rawUrl = prefs.piper_url.trim()
    const backendUrl = piperUrlForBackend(rawUrl)

    if (isPublicPiperUrl(rawUrl)) {
      try {
        const direct = await tryPiperDirect(rawUrl, text, language)
        if (direct) return
      } catch {
        // fallback abajo
      }
    }

    try {
      const viaBackend = await tryPiperViaBackend(
        text,
        backendUrl,
        language,
        prefs.piper_voice,
        prefs.piper_host || undefined,
      )
      if (viaBackend) return
    } catch {
      // fallback abajo
    }
  }

  speakText(text, voiceOptions(profile))
}

export type PiperTestResult =
  | { ok: true; source: 'direct' | 'backend'; provider: string }
  | { ok: false; error: string }

export async function testPiperVoice(
  piperUrl: string,
  profile: Profile | null | undefined,
  sample = 'Hola, probando la voz de Piper',
  piperVoice?: string,
  piperHost?: string,
): Promise<PiperTestResult> {
  unlockSpeech()
  const language = profile?.language ?? 'es-AR'
  const prefs = getTtsPreferences(profile)
  const rawUrl = piperUrl.trim()
  const backendUrl = piperUrlForBackend(rawUrl)
  const voice = piperVoice ?? prefs.piper_voice
  const host = piperHost ?? prefs.piper_host

  if (isPublicPiperUrl(rawUrl)) {
    const direct = await tryPiperDirect(rawUrl, sample, language)
    if (direct) return { ok: true, source: 'direct', provider: 'piper_http' }
  }

  try {
    const result = await api.testPiper(backendUrl, sample, voice || undefined, host || undefined)
    if (result.audio_base64) {
      await playBase64(result.audio_base64, result.audio_content_type ?? 'audio/wav')
      return { ok: true, source: 'backend', provider: result.provider }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Piper no respondió'
    return { ok: false, error: message }
  }

  return {
    ok: false,
    error:
      'Piper no respondió. Dejá la URL vacía en Coolify (el backend usa la red interna) o configurá PIPER_WYOMING_HOST en el servidor.',
  }
}
