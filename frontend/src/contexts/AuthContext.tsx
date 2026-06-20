import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { Profile, User } from '../types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  highContrast: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  setHighContrast: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [highContrast, setHighContrast] = useState(false)

  const refreshProfile = async () => {
    const p = await api.getProfile()
    setProfile(p)
    setHighContrast(p.high_contrast)
  }

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      setLoading(false)
      return
    }
    Promise.all([api.me(), api.getProfile()])
      .then(([u, p]) => {
        setUser(u)
        setProfile(p)
        setHighContrast(p.high_contrast)
      })
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast)
  }, [highContrast])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      highContrast,
      login: async (email: string, password: string) => {
        const { access_token } = await api.login(email, password)
        api.setToken(access_token)
        const [u, p] = await Promise.all([api.me(), api.getProfile()])
        setUser(u)
        setProfile(p)
        setHighContrast(p.high_contrast)
      },
      logout: () => {
        api.setToken(null)
        setUser(null)
        setProfile(null)
      },
      refreshProfile,
      setHighContrast,
    }),
    [user, profile, loading, highContrast],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
