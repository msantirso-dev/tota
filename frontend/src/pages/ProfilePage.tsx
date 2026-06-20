import { useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

export function ProfilePage() {
  const { profile, refreshProfile, setHighContrast, highContrast } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [voiceRate, setVoiceRate] = useState(profile?.voice_rate ?? 1)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await api.updateProfile({
      display_name: displayName,
      voice_rate: voiceRate,
      high_contrast: highContrast,
    })
    await refreshProfile()
    setSaved(true)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Perfil</h1>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Nombre para mostrar</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border px-4 py-3 text-lg"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Velocidad de voz: {voiceRate.toFixed(1)}</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceRate}
              onChange={(e) => setVoiceRate(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
            <span>Modo alto contraste</span>
          </label>

          <button
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Guardar perfil
          </button>

          {saved && <p className="text-sm text-green-600">Perfil actualizado</p>}
        </div>
      </div>
    </AppLayout>
  )
}
