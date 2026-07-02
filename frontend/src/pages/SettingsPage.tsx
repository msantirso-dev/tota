import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { PiperVoiceOption, TtsMode } from '../types'
import { piperHostInputHint, normalizePiperHost } from '../utils/piperHost'
import { getTtsPreferences, piperUrlForBackend, testPiperVoice } from '../utils/tts'
import { speakText, unlockSpeech } from '../utils/phrase'

type TtsServerInfo = {
  httpUrl: string | null
  wyomingHost: string | null
  wyomingPort: number | null
}

type PiperHostDiag = {
  host: string
  dns: boolean
  wyoming: boolean
  http: boolean
  error: string | null
}

export function SettingsPage() {
  const { user, profile, setHighContrast, highContrast, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<Array<{ key: string; value: Record<string, unknown> }>>([])
  const [ttsMode, setTtsMode] = useState<TtsMode>('browser')
  const [piperUrl, setPiperUrl] = useState('')
  const [piperHost, setPiperHost] = useState('')
  const [piperVoice, setPiperVoice] = useState('')
  const [piperVoices, setPiperVoices] = useState<PiperVoiceOption[]>([])
  const [piperVoicesLoading, setPiperVoicesLoading] = useState(false)
  const [ttsMessage, setTtsMessage] = useState('')
  const [ttsTesting, setTtsTesting] = useState(false)
  const [ttsSaving, setTtsSaving] = useState(false)
  const [serverTts, setServerTts] = useState<TtsServerInfo>({
    httpUrl: null,
    wyomingHost: null,
    wyomingPort: null,
  })
  const [piperDiag, setPiperDiag] = useState<{
    hosts: PiperHostDiag[]
    reachable: boolean
    hint: string | null
  } | null>(null)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {})
    api
      .getTtsConfig()
      .then((c) =>
        setServerTts({
          httpUrl: c.piper_http_url ?? c.piper_url,
          wyomingHost: c.piper_wyoming_host,
          wyomingPort: c.piper_wyoming_port,
        }),
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ttsMode !== 'piper') {
      setPiperDiag(null)
      setPiperVoices([])
      return
    }
    const host = normalizePiperHost(piperHost) || undefined
    api
      .getTtsDiagnostics(host)
      .then(setPiperDiag)
      .catch(() => setPiperDiag(null))

    setPiperVoicesLoading(true)
    api
      .getPiperVoices(piperUrlForBackend(piperUrl), host)
      .then((res) => setPiperVoices(res.voices))
      .catch(() => setPiperVoices([]))
      .finally(() => setPiperVoicesLoading(false))
  }, [ttsMode, piperUrl, piperHost])

  useEffect(() => {
    const prefs = getTtsPreferences(profile)
    setTtsMode(prefs.tts_mode)
    setPiperUrl(prefs.piper_url)
    setPiperHost(normalizePiperHost(prefs.piper_host))
    setPiperVoice(prefs.piper_voice)
  }, [profile])

  const piperHostHint = piperHostInputHint(piperHost)

  const toggleContrast = async () => {
    const next = !highContrast
    setHighContrast(next)
    await api.updateProfile({ high_contrast: next })
    await refreshProfile()
  }

  const saveTtsSettings = async () => {
    setTtsSaving(true)
    setTtsMessage('')
    try {
      const trimmed = piperUrl.trim()
      const isInternal =
        trimmed.includes('piper-tts') || trimmed.includes('piper:') || trimmed.includes(':10200')
      const host = normalizePiperHost(piperHost)
      const hadBadHost = piperHost.trim().length > 0 && !host

      await api.updateProfile({
        preferences: {
          tts_mode: ttsMode,
          piper_url: isInternal ? '' : trimmed,
          piper_host: ttsMode === 'piper' ? host : '',
          piper_voice: ttsMode === 'piper' ? piperVoice : '',
        },
      })
      await refreshProfile()
      if (hadBadHost) {
        setPiperHost('')
        setTtsMessage(
          'Se quitó el hostname inválido (127.0.0.1 no es Piper). En Coolify → Piper → Terminal ejecutá: hostname',
        )
      } else if (isInternal && trimmed) {
        setPiperUrl('')
        setTtsMessage(
          'Guardado. Se quitó la URL interna (piper-tts) — el backend la resuelve solo en Coolify.',
        )
      } else {
        setTtsMessage('Configuración de voz guardada')
      }
    } catch (err) {
      setTtsMessage(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setTtsSaving(false)
    }
  }

  const handleTestVoice = async () => {
    setTtsTesting(true)
    setTtsMessage('')
    try {
      if (ttsMode === 'browser') {
        unlockSpeech()
        speakText('Hola, probando la voz del navegador', {
          rate: profile?.voice_rate,
          pitch: profile?.voice_pitch,
          language: profile?.language,
        })
        setTtsMessage('Reproduciendo voz del navegador')
      } else {
        const result = await testPiperVoice(
          piperUrl,
          profile,
          undefined,
          piperVoice,
          normalizePiperHost(piperHost) || undefined,
        )
        if (!result.ok) {
          setTtsMessage(`Error: ${result.error}`)
          return
        }
        const sourceLabel =
          result.source === 'direct'
            ? 'Piper (conexión directa desde el dispositivo)'
            : `Piper (vía servidor TOTA · ${result.provider})`
        setTtsMessage(`Prueba OK: ${sourceLabel}`)
      }
    } catch (err) {
      setTtsMessage(err instanceof Error ? err.message : 'Error en la prueba de voz')
    } finally {
      setTtsTesting(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-bold">Configuración</h1>

        <div className="space-y-4">
          <div className="surface rounded-2xl border p-4">
            <p className="font-medium">Usuario</p>
            <p className="text-sm opacity-70">{user?.email}</p>
            <p className="text-sm opacity-70">Rol: {user?.role}</p>
          </div>

          <section className="surface rounded-2xl border p-4">
            <h2 className="mb-1 text-lg font-semibold">Voz / TTS</h2>
            <p className="mb-4 text-sm text-slate-500">
              Elegí cómo se reproduce el audio al tocar botones y hablar frases.
            </p>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50/50">
                <input
                  type="radio"
                  name="tts_mode"
                  checked={ttsMode === 'browser'}
                  onChange={() => setTtsMode('browser')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Voz del navegador</p>
                  <p className="text-sm text-slate-500">
                    Usa la síntesis de voz local del dispositivo (Chrome/Android). Funciona sin
                    servidor extra.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50/50">
                <input
                  type="radio"
                  name="tts_mode"
                  checked={ttsMode === 'piper'}
                  onChange={() => setTtsMode('piper')}
                  className="mt-1"
                />
                <div className="w-full">
                  <p className="font-medium">Piper (servidor TTS)</p>
                  <p className="mb-2 text-sm text-slate-500">
                    En Coolify dejá la URL <strong>vacía</strong>: el backend TOTA habla con Piper
                    por la red Docker interna. No uses <code>piper-tts</code> en el navegador — ese
                    hostname solo existe dentro del servidor.
                  </p>
                  {(serverTts.httpUrl || serverTts.wyomingHost) && (
                    <p className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                      Backend configurado:
                      {serverTts.httpUrl && (
                        <>
                          {' '}
                          HTTP <code>{serverTts.httpUrl}</code>
                        </>
                      )}
                      {serverTts.wyomingHost && (
                        <>
                          {' '}
                          · Wyoming <code>{serverTts.wyomingHost}:{serverTts.wyomingPort ?? 10200}</code>
                        </>
                      )}
                    </p>
                  )}
                  {piperDiag && !piperDiag.reachable && (
                    <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      <p className="font-semibold">Red Docker: Piper no alcanzable</p>
                      {piperDiag.hint && <p className="mt-1">{piperDiag.hint}</p>}
                      <ul className="mt-2 space-y-1">
                        {piperDiag.hosts.map((h) => (
                          <li key={h.host}>
                            <code>{h.host}</code> — DNS {h.dns ? '✓' : '✗'}
                            {h.dns && (
                              <>
                                {' '}
                                · Wyoming {h.wyoming ? '✓' : '✗'} · HTTP {h.http ? '✓' : '✗'}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2">
                        Aunque estén en la misma red Coolify, el nombre interno puede no ser{' '}
                        <code>piper-tts</code>. En Piper → <strong>Terminal</strong> ejecutá{' '}
                        <code>hostname</code> y poné ese valor abajo en Hostname Piper.
                      </p>
                    </div>
                  )}
                  <ul className="mb-3 list-inside list-disc space-y-1 text-xs text-slate-500">
                    <li>
                      <strong>Mismo servidor Coolify:</strong> URL vacía (recomendado)
                    </li>
                    <li>
                      <strong>Tablet con proxy público:</strong> URL HTTPS del proxy Piper (no
                      IP:puerto ni nombres Docker)
                    </li>
                  </ul>
                  {ttsMode === 'piper' && (
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="piper-voice"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Voz Piper
                        </label>
                        <select
                          id="piper-voice"
                          value={piperVoice}
                          onChange={(e) => setPiperVoice(e.target.value)}
                          disabled={piperVoicesLoading}
                          className="w-full rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50"
                        >
                          <option value="">Por defecto del servidor</option>
                          {piperVoice &&
                            !piperVoices.some((v) => v.id === piperVoice) && (
                              <option value={piperVoice}>{piperVoice}</option>
                            )}
                          {piperVoices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.label}
                              {voice.languages.length
                                ? ` (${voice.languages.join(', ')})`
                                : ''}
                              {!voice.installed ? ' · no instalada' : ''}
                            </option>
                          ))}
                        </select>
                        {piperVoicesLoading && (
                          <p className="mt-1 text-xs text-slate-500">Cargando voces de Piper…</p>
                        )}
                        {!piperVoicesLoading && piperVoices.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            No se pudieron cargar voces. Verificá la conexión con Piper arriba.
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="piper-host"
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Hostname Piper (red interna Coolify)
                        </label>
                        <input
                          id="piper-host"
                          value={piperHost}
                          onChange={(e) => setPiperHost(e.target.value)}
                          onBlur={() => setPiperHost(normalizePiperHost(piperHost))}
                          placeholder="Ej. piper-tts · vacío = env del backend"
                          className={`w-full rounded-lg border px-3 py-2 text-sm ${
                            piperHostHint ? 'border-amber-400 bg-amber-50' : ''
                          }`}
                        />
                        {piperHostHint ? (
                          <p className="mt-1 text-xs text-amber-800">{piperHostHint}</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            Coolify → servicio <strong>Piper</strong> → Terminal →{' '}
                            <code>hostname</code> (no uses 127.0.0.1).
                          </p>
                        )}
                      </div>
                      <input
                        value={piperUrl}
                        onChange={(e) => setPiperUrl(e.target.value)}
                        placeholder="Vacío = backend Coolify · o URL pública del proxy"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveTtsSettings}
                disabled={ttsSaving}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {ttsSaving ? 'Guardando...' : 'Guardar voz'}
              </button>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={ttsTesting}
                className="rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {ttsTesting ? 'Probando...' : 'Probar voz'}
              </button>
            </div>

            {ttsMessage && (
              <p
                className={`mt-3 text-sm ${
                  ttsMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {ttsMessage}
              </p>
            )}
          </section>

          <button
            onClick={toggleContrast}
            className="surface w-full rounded-2xl border p-4 text-left hover:bg-indigo-50"
          >
            Alto contraste: {highContrast ? 'Activado' : 'Desactivado'}
          </button>

          {settings.map((setting) => (
            <div key={setting.key} className="surface rounded-2xl border p-4">
              <p className="font-medium">{setting.key}</p>
              <pre className="mt-2 overflow-auto text-xs opacity-70">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
