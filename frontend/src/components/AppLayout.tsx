import type { ComponentType } from 'react'
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
import { YoutubeIcon } from './YoutubeIcon'

const YOUTUBE_URL = 'https://www.youtube.com'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  emergency?: boolean
  external?: boolean
  youtube?: boolean
}

const baseLinks: NavItem[] = [
  { to: '/', label: 'Tablero', icon: Grid3X3 },
  { to: '/editor', label: 'Editor', icon: LayoutGrid },
  { to: '/entorno', label: 'Entorno', icon: Home },
  { to: '/historial', label: 'Historial', icon: Clock },
  { to: YOUTUBE_URL, label: 'YouTube', icon: YoutubeIcon, external: true, youtube: true },
  { to: '/asistente', label: 'Asistente', icon: Bot },
  { to: '/perfil', label: 'Perfil', icon: User },
  { to: '/configuracion', label: 'Config', icon: Settings },
  { to: '/emergencia', label: 'Emergencia', icon: AlertTriangle, emergency: true },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, profile, user } = useAuth()

  const links: NavItem[] =
    user?.role === 'admin' || user?.role === 'terapeuta'
      ? [
          ...baseLinks.slice(0, 2),
          { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
          ...baseLinks.slice(2),
        ]
      : baseLinks

  const navLinkClass = (isActive: boolean, emergency?: boolean, youtube?: boolean) => {
    if (emergency) {
      return 'bg-red-600 text-white hover:bg-red-700'
    }
    if (youtube) {
      return 'text-red-600 hover:bg-red-50 high-contrast:text-red-400 high-contrast:hover:bg-zinc-800'
    }
    if (isActive) {
      return 'bg-indigo-100 text-indigo-700 high-contrast:bg-yellow-300 high-contrast:text-black'
    }
    return 'hover:bg-slate-100 high-contrast:hover:bg-zinc-800'
  }

  const renderDesktopLink = ({ to, label, icon: Icon, emergency, external, youtube }: NavItem) => {
    const className = `flex min-h-[2.75rem] items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium lg:text-base ${navLinkClass(false, emergency, youtube)}`

    if (external) {
      return (
        <a
          key={to}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          aria-label={`Abrir ${label} en una pestaña nueva`}
        >
          <Icon size={20} className="shrink-0" />
          {label}
        </a>
      )
    }

    return (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex min-h-[2.75rem] items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium lg:text-base ${navLinkClass(isActive, emergency, youtube)}`
        }
      >
        <Icon size={20} className="shrink-0" />
        {label}
      </NavLink>
    )
  }

  const renderMobileLink = ({ to, label, icon: Icon, emergency, external, youtube }: NavItem) => {
    const inactiveClass = youtube
      ? 'text-red-600 high-contrast:text-red-400'
      : 'opacity-75'

    if (external) {
      return (
        <a
          key={to}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[0.65rem] font-medium xs:min-w-[4.75rem] xs:text-xs ${inactiveClass}`}
          aria-label={`Abrir ${label} en una pestaña nueva`}
        >
          <Icon size={22} className="mb-0.5" />
          <span className="max-w-[4.5rem] truncate text-center leading-tight">{label}</span>
        </a>
      )
    }

    return (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[0.65rem] font-medium xs:min-w-[4.75rem] xs:text-xs ${
            emergency
              ? 'bg-red-600 text-white'
              : isActive
                ? 'text-indigo-600 high-contrast:text-yellow-300'
                : inactiveClass
          }`
        }
      >
        <Icon size={22} className="mb-0.5" />
        <span className="max-w-[4.5rem] truncate text-center leading-tight">{label}</span>
      </NavLink>
    )
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
            {links.map(renderDesktopLink)}
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

      <nav className="bottom-nav surface fixed bottom-0 left-0 right-0 z-20 border-t md:hidden">
        <div className="bottom-nav-scroll flex gap-1 overflow-x-auto px-1 pt-2">
          {links.map(renderMobileLink)}
        </div>
      </nav>
    </div>
  )
}
