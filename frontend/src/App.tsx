import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { BoardEditorPage } from './pages/BoardEditorPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmergencyPage } from './pages/EmergencyPage'
import { EnvironmentPage } from './pages/EnvironmentPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersAdminPage } from './pages/UsersAdminPage'
import { AdminRoute } from './components/AdminRoute'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/editor" element={<PrivateRoute><BoardEditorPage /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/entorno" element={<PrivateRoute><EnvironmentPage /></PrivateRoute>} />
      <Route path="/historial" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
      <Route path="/configuracion" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/admin/usuarios" element={<PrivateRoute><AdminRoute><UsersAdminPage /></AdminRoute></PrivateRoute>} />
      <Route path="/emergencia" element={<PrivateRoute><EmergencyPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
