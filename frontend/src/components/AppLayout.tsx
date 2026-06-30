import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Clock,
  Grid3X3,
  Home,
  LayoutGrid,
  LogOut,
  Settings,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const baseLinks = [
  { to: '/', label: 'Tablero', icon: Grid3X3 },
  { to: '/editor', label: 'Editor', icon: LayoutGrid },
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

  const navLinkClass = (isActive: boolean, emergency?: boolean) => {
    if (emergency) {
      return 'bg-red-600 text-white hover:bg-red-700'
    }
    if (isActive) {
      return 'bg-indigo-100 text-indigo-700 high-contrast:bg-yellow-300 high-contrast:text-black'
    }
    return 'hover:bg-slate-100 high-contrast:hover:bg-zinc-800'
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col md:flex-row">
      <aside className="surface shrink-0 border-b md:w-52 md:border-b-0 md:border-r lg:w-56 xl:w-60">
        <div className="flex items-center justify-between px-4 py-3 md:flex-col md:items-stretch md:gap-2 md:py-4">
          <div className="md:px-1">
            <p className="text-lg font-bold text-indigo-600 md:text-xl high-contrast:text-yellow-300">
              TOTA AAC
            </p>
            <p className="text-xs opacity-70 md:text-sm">{profile?.display_name}</p>
          </div>
          <nav className="hidden gap-1 md:flex md:flex-col">
            {links.map(({ to, label, icon: Icon, emergency }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-[2.75rem] items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium lg:text-base ${navLinkClass(isActive, emergency)}`
                }
              >
                <Icon size={20} className="shrink-0" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="mt-2 flex min-h-[2.75rem] items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-100 lg:text-base"
            >
              <LogOut size={20} />
              Salir
            </button>
          </nav>
        </div>
      </aside>

      <main className="has-bottom-nav md:pb-0 flex-1 overflow-auto">{children}</main>

      {/* Navegación inferior: teléfonos y tablets en portrait (< md) */}
      <nav className="bottom-nav surface fixed bottom-0 left-0 right-0 z-20 border-t md:hidden">
        <div className="bottom-nav-scroll flex gap-1 overflow-x-auto px-1 pt-2">
          {links.map(({ to, label, icon: Icon, emergency }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[0.65rem] font-medium xs:min-w-[4.75rem] xs:text-xs ${
                  emergency
                    ? 'bg-red-600 text-white'
                    : isActive
                      ? 'text-indigo-600 high-contrast:text-yellow-300'
                      : 'opacity-75'
                }`
              }
            >
              <Icon size={22} className="mb-0.5" />
              <span className="max-w-[4.5rem] truncate text-center leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
