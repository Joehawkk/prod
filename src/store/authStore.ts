import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type LogoutListener = () => void
const logoutListeners = new Set<LogoutListener>()

export function onLogout(cb: LogoutListener) {
  logoutListeners.add(cb)
  return () => { logoutListeners.delete(cb) }
}

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  hasProfile: boolean
  setToken: (token: string) => void
  setHasProfile: (v: boolean) => void
  loginWith: (token: string, hasProfile: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      hasProfile: false,
      setToken: (token) => set({ token, isAuthenticated: true }),
      setHasProfile: (v) => set({ hasProfile: v }),
      loginWith: (token, hasProfile) => set({ token, isAuthenticated: true, hasProfile }),
      logout: () => {
        set({ token: null, isAuthenticated: false, hasProfile: false })
        logoutListeners.forEach((cb) => cb())
      },
    }),
    { name: 'auth-storage' }
  )
)
