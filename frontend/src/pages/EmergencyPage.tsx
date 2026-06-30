import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { api } from '../services/api'
import type { EmergencyContact } from '../types'
import { speakWithProfile } from '../utils/tts'

import { useAuth } from '../contexts/AuthContext'

export function EmergencyPage() {
  const { profile } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getEmergencyContacts().then(setContacts)
  }, [])

  const handleFirstClick = () => {
    void speakWithProfile('¿Confirmás que necesitás ayuda de emergencia?', profile)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    const result = await api.triggerEmergency('Necesito ayuda urgente', true)
    void speakWithProfile('Emergencia activada. Se notificó a tus contactos.', profile)
    setMessage(result.message)
    setStep('done')
  }

  const handleCancel = () => setStep('idle')

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center p-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={48} />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-red-600">Modo Emergencia</h1>
        <p className="mb-8 text-slate-600">
          Este botón siempre está visible. Se requiere confirmación antes de activar.
        </p>

        {step === 'idle' && (
          <button
            onClick={handleFirstClick}
            className="w-full rounded-2xl bg-red-600 py-6 text-2xl font-bold text-white hover:bg-red-700"
          >
            Necesito ayuda
          </button>
        )}

        {step === 'confirm' && (
          <div className="w-full space-y-4">
            <p className="text-xl font-semibold">¿Confirmás la emergencia?</p>
            <button
              onClick={handleConfirm}
              className="w-full rounded-2xl bg-red-600 py-5 text-xl font-bold text-white"
            >
              Sí, necesito ayuda ahora
            </button>
            <button
              onClick={handleCancel}
              className="w-full rounded-2xl border py-4 text-lg"
            >
              Cancelar
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="w-full rounded-2xl bg-green-50 p-6 text-green-800">
            <p className="text-lg font-semibold">{message}</p>
            <button onClick={() => setStep('idle')} className="mt-4 underline">
              Volver
            </button>
          </div>
        )}

        <div className="mt-10 w-full text-left">
          <h2 className="mb-3 font-semibold">Contactos de emergencia</h2>
          {contacts.map((contact) => (
            <div key={contact.id} className="surface mb-2 rounded-xl border p-4">
              <p className="font-medium">{contact.name}</p>
              {contact.phone && <p className="text-sm">{contact.phone}</p>}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
