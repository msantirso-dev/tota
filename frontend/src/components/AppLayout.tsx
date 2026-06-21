import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Clock,
  Grid3X3,
  Home,
  LogOut,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const baseLinks = [
  { to: '/', label: 'Tablero', icon: Grid3X3 },
  { to: '/editor', label: 'Editor', icon: Home },
  { to: '/entorno', label: 'Entorno', icon: Home },
  { to: '/historial', label: 'Historial', icon: Clock },
  { to: '/asistente', label: 'Asistente', icon: Bot },
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/configuracion', label: 'Config', icon: Settings },
  { to: '/emergencia', label: 'Emergencia', icon: AlertTriangle, emergency: true },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, profile, user } = useAuth()

  const links =
    user?.role === 'admin' || user?.role === 'terapeuta'
      ? [
          ...baseLinks.slice(0, 2),
          { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
          ...baseLinks.slice(2),
        ]
      : baseLinks

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="surface border-b lg:w-56 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:flex-col lg:items-stretch lg:gap-2">
          <div>
            <p className="text-xl font-bold text-indigo-600 high-contrast:text-yellow-300">TOTA AAC</p>
            <p className="text-sm opacity-70">{profile?.display_name}</p>
          </div>
          <nav className="hidden gap-1 lg:flex lg:flex-col">
            {links.map(({ to, label, icon: Icon, emergency }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    emergency
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : isActive
                        ? 'bg-indigo-100 text-indigo-700 high-contrast:bg-yellow-300 high-contrast:text-black'
                        : 'hover:bg-slate-100 high-contrast:hover:bg-zinc-800'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <LogOut size={18} />
              Salir
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>

      <nav className="surface fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t p-2 lg:hidden">
        {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-lg px-2 py-1 text-xs ${
                isActive ? 'text-indigo-600 high-contrast:text-yellow-300' : 'opacity-70'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
