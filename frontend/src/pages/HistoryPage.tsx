import { useEffect, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { api } from '../services/api'
import type { HistoryEntry, Phrase } from '../types'
import { speakWithProfile } from '../utils/tts'
import { useAuth } from '../contexts/AuthContext'

export function HistoryPage() {
  const { profile } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [frequent, setFrequent] = useState<Phrase[]>([])

  useEffect(() => {
    Promise.all([api.getHistory(), api.getFrequentPhrases()]).then(([h, f]) => {
      setHistory(h)
      setFrequent(f)
    })
  }, [])

  return (
    <AppLayout>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-bold">Frases frecuentes</h2>
          <div className="space-y-2">
            {frequent.map((phrase) => (
              <button
                key={phrase.id}
                onClick={() => void speakWithProfile(phrase.spoken_text, profile)}
                className="surface block w-full rounded-xl border p-4 text-left hover:bg-indigo-50"
              >
                <p className="font-medium">{phrase.text}</p>
                <p className="text-xs opacity-60">Usada {phrase.use_count} veces</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Historial reciente</h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="surface rounded-xl border p-4">
                <p>{entry.phrase_text}</p>
                <p className="text-xs opacity-60">
                  {new Date(entry.created_at).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
