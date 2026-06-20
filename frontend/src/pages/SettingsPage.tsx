import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

export function SettingsPage() {
  const { user, setHighContrast, highContrast, refreshProfile } = useAuth()
  const [settings, setSettings] = useState<Array<{ key: string; value: Record<string, unknown> }>>([])

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {})
  }, [])

  const toggleContrast = async () => {
    const next = !highContrast
    setHighContrast(next)
    await api.updateProfile({ high_contrast: next })
    await refreshProfile()
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Configuración</h1>

        <div className="space-y-4">
          <div className="surface rounded-2xl border p-4">
            <p className="font-medium">Usuario</p>
            <p className="text-sm opacity-70">{user?.email}</p>
            <p className="text-sm opacity-70">Rol: {user?.role}</p>
          </div>

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
