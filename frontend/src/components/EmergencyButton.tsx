import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export function EmergencyButton() {
  return (
    <Link
      to="/emergencia"
      className="fixed bottom-20 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-4 ring-red-200 hover:bg-red-700 lg:bottom-6"
      aria-label="Emergencia"
    >
      <AlertTriangle size={28} />
    </Link>
  )
}
