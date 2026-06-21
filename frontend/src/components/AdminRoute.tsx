import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  if (!user || !['admin', 'terapeuta'].includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
