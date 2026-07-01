import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { TtsMode } from '../types'
import { getTtsPreferences, testPiperVoice } from '../utils/tts'
import { speakText, unlockSpeech } from '../utils/phrase'

type TtsServerInfo = {
  httpUrl: string | null
  wyomingHost: string | null
  wyomingPort: number | null
}

export function SettingsPage() {
  const { user, profile, setHighContrast, highContrast, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<Array<{ key: string; value: Record<string, unknown> }>>([])
  const [ttsMode, setTtsMode] = useState<TtsMode>('browser')
  const [piperUrl, setPiperUrl] = useState('')
  const [ttsMessage, setTtsMessage] = useState('')
  const [ttsTesting, setTtsTesting] = useState(false)
  const [ttsSaving, setTtsSaving] = useState(false)
  const [serverTts, setServerTts] = useState<TtsServerInfo>({
    httpUrl: null,
    wyomingHost: null,
    wyomingPort: null,
  })

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
    const prefs = getTtsPreferences(profile)
    setTtsMode(prefs.tts_mode)
    setPiperUrl(prefs.piper_url)
  }, [profile])

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

      await api.updateProfile({
        preferences: {
          tts_mode: ttsMode,
          piper_url: isInternal ? '' : trimmed,
        },
      })
      await refreshProfile()
      if (isInternal && trimmed) {
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
        const result = await testPiperVoice(piperUrl, profile)
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
                  {serverTts.wyomingHost === 'piper' && (
                    <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      El backend usa el hostname <code>piper</code>, que suele fallar en Coolify.
                      Cambiá en el servicio backend:{' '}
                      <code>PIPER_WYOMING_HOST=piper-tts</code> y{' '}
                      <code>PIPER_BASE_URL=http://piper-tts:5000</code>, luego redeploy.
                    </p>
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
                    <input
                      value={piperUrl}
                      onChange={(e) => setPiperUrl(e.target.value)}
                      placeholder="Vacío = backend Coolify · o URL pública del proxy"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
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
