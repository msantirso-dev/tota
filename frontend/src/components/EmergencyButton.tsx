import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export function EmergencyButton() {
  return (
    <Link
      to="/emergencia"
      className="fixed bottom-[calc(var(--nav-bottom)+var(--safe-bottom)+0.5rem)] right-3 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-4 ring-red-200 hover:bg-red-700 active:scale-95 md:bottom-6 md:right-6 md:h-16 md:w-16"
      aria-label="Emergencia"
    >
      <AlertTriangle size={28} />
    </Link>
  )
}
