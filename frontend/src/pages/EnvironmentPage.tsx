import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { api } from '../services/api'
import type { AutomationAction } from '../types'

export function EnvironmentPage() {
  const [actions, setActions] = useState<AutomationAction[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getAutomationActions().then(setActions)
  }, [])

  const runAction = async (action: AutomationAction) => {
    const needsConfirm = action.requires_confirmation
    let confirmed = !needsConfirm

    if (needsConfirm) {
      confirmed = window.confirm(`¿Confirmás la acción "${action.name}"?`)
    }

    const result = await api.executeAutomation(action.id, confirmed)
    if (result.requires_confirmation) {
      setMessage('Esta acción requiere confirmación')
      return
    }
    setMessage(result.message)
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Entorno / Domótica</h1>
        <p className="mb-6 text-slate-600">
          Acciones configurables del entorno. Todas requieren confirmación humana.
        </p>

        {message && <p className="mb-4 rounded-xl bg-indigo-50 p-3 text-sm">{message}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => runAction(action)}
              className="aac-button min-h-[6rem] text-left"
            >
              <span className="text-lg font-bold">{action.name}</span>
              <span className="mt-1 text-xs opacity-60">{action.action_type}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
