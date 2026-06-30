import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { TtsMode } from '../types'
import { getTtsPreferences, testPiperVoice } from '../utils/tts'
import { speakText, unlockSpeech } from '../utils/phrase'

export function SettingsPage() {
  const { user, profile, setHighContrast, highContrast, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<Array<{ key: string; value: Record<string, unknown> }>>([])
  const [ttsMode, setTtsMode] = useState<TtsMode>('browser')
  const [piperUrl, setPiperUrl] = useState('')
  const [ttsMessage, setTtsMessage] = useState('')
  const [ttsTesting, setTtsTesting] = useState(false)
  const [ttsSaving, setTtsSaving] = useState(false)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {})
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
      await api.updateProfile({
        preferences: {
          tts_mode: ttsMode,
          piper_url: piperUrl.trim(),
        },
      })
      await refreshProfile()
      setTtsMessage('Configuración de voz guardada')
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
        const sourceLabel =
          result.source === 'direct'
            ? 'Piper (conexión directa desde el dispositivo)'
            : result.source === 'backend'
              ? 'Piper (vía servidor TOTA)'
              : 'Navegador (Piper no respondió)'
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
                  <p className="font-medium">Piper (servidor local)</p>
                  <p className="mb-3 text-sm text-slate-500">
                    Conecta con un servidor Piper en tu red (ej.{' '}
                    <code className="text-xs">http://192.168.2.252:5000</code>).
                  </p>
                  {ttsMode === 'piper' && (
                    <input
                      value={piperUrl}
                      onChange={(e) => setPiperUrl(e.target.value)}
                      placeholder="http://192.168.2.252:5000"
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
                className={`mt-3 text-sm ${ttsMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}
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
