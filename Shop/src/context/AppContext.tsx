import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Session, SessionUser, Settings } from '../types'
import { uuid } from '../services/id'
import { seedDatabase } from '../db/seed'

const SESSION_KEY = 'dukan-session'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

interface AppContextValue {
  settings: Settings | undefined
  session: Session | null
  user: SessionUser | null
  isOwner: boolean
  online: boolean
  login: (userId: string, pin: string) => Promise<{ ok: true } | { ok: false; reason: 'wrong_pin' | 'inactive' | 'missing' }>
  logout: () => void
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  notify: (message: string, tone?: ToastTone) => void
  toasts: Toast[]
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (parsed?.user?.id && parsed?.user?.role) return parsed
  } catch {
    // Ignore broken session data
  }
  return null
}

export function AppProvider({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const [session, setSession] = useState<Session | null>(readSession)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (!settings) {
      void seedDatabase().catch(() => undefined)
    }
  }, [settings])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = uuid()
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismissToast(id), 4500)
    },
    [dismissToast]
  )

  const login = useCallback(async (userId: string, pin: string) => {
    const account = await db.users.get(userId)
    if (!account) return { ok: false as const, reason: 'missing' as const }
    if (!account.active) return { ok: false as const, reason: 'inactive' as const }
    if (account.pin !== pin.trim()) return { ok: false as const, reason: 'wrong_pin' as const }
    const next: Session = {
      user: { id: account.id, name: account.name, role: account.role },
      signedInAt: new Date().toISOString()
    }
    setSession(next)
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      // Session still works for this tab
    }
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // Ignore
    }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    await db.settings.update('shop', patch)
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      session,
      user: session?.user ?? null,
      isOwner: session?.user.role === 'owner',
      online,
      login,
      logout,
      updateSettings,
      notify,
      toasts,
      dismissToast
    }),
    [settings, session, online, login, logout, updateSettings, notify, toasts, dismissToast]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
