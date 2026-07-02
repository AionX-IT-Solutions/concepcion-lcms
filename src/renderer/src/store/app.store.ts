import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { getAuditUserDisplayName, logAudit } from '../lib/audit'
import type { UpdateStatus } from '../../../shared/ipc-types'

function getSystemDefaultTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'auth.invalidCredentials'
    case 'auth/too-many-requests':
      return 'auth.tooManyRequests'
    case 'auth/network-request-failed':
      return 'auth.networkError'
    default:
      return 'auth.genericError'
  }
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
}

export interface CurrentUserProfile {
  email: string | null
  displayName: string | null
  role: string | null
}

export type AccentColor = 'indigo' | 'cyan' | 'emerald' | 'rose'
export type Theme = 'dark' | 'light'
export type Language = 'en' | 'tl'

interface AppState {
  isAuthenticated: boolean
  authChecked: boolean
  currentUser: CurrentUserProfile
  sidebarCollapsed: boolean
  theme: Theme
  language: Language
  accentColor: AccentColor
  notifications: Notification[]
  notificationsEnabled: boolean
  soundEnabled: boolean
  updateNotifs: boolean
  securityAlerts: boolean
  dataCollection: boolean
  crashReports: boolean
  compactMode: boolean
  fontSize: number[]
  updateStatus: UpdateStatus | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  setAuthenticated: (authenticated: boolean) => void
  setAuthChecked: (checked: boolean) => void
  setCurrentUser: (profile: Partial<CurrentUserProfile>) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setLanguage: (language: Language) => void
  setAccentColor: (color: AccentColor) => void
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setNotificationsEnabled: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setUpdateNotifs: (enabled: boolean) => void
  setSecurityAlerts: (enabled: boolean) => void
  setDataCollection: (enabled: boolean) => void
  setCrashReports: (enabled: boolean) => void
  setCompactMode: (enabled: boolean) => void
  setFontSize: (size: number[]) => void
  setUpdateStatus: (status: UpdateStatus | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      authChecked: false,
      currentUser: { email: null, displayName: null, role: null },
      sidebarCollapsed: false,
      theme: getSystemDefaultTheme(),
      language: 'en',
      accentColor: 'indigo',
      notifications: [],
      notificationsEnabled: true,
      soundEnabled: false,
      updateNotifs: true,
      securityAlerts: true,
      dataCollection: false,
      crashReports: true,
      compactMode: false,
      fontSize: [14],
      updateStatus: null,

      login: async (email, password) => {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password)
          const profile = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null)
          const who =
            (profile?.data()?.displayName as string | undefined) ||
            cred.user.displayName ||
            email
          void logAudit({ action: 'Signed in', module: 'Auth', target: email, userOverride: who })
          return null
        } catch (err) {
          const code = err instanceof Error && 'code' in err ? String((err as { code: string }).code) : ''
          return mapAuthError(code)
        }
      },
      logout: async () => {
        const who =
          getAuditUserDisplayName() ??
          auth.currentUser?.displayName ??
          auth.currentUser?.email ??
          'Unknown user'
        await signOut(auth)
        void logAudit({ action: 'Signed out', module: 'Auth', target: who, userOverride: who })
      },
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setAuthChecked: (checked) => set({ authChecked: checked }),
      setCurrentUser: (profile) => set((s) => ({ currentUser: { ...s.currentUser, ...profile } })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (language) => set({ language }),
      setAccentColor: (accentColor) => set({ accentColor }),

      addNotification: (notif) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            {
              ...notif,
              id: Math.random().toString(36).slice(2),
              timestamp: Date.now()
            }
          ]
        })),

      removeNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      clearNotifications: () => set({ notifications: [] }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setUpdateNotifs: (updateNotifs) => set({ updateNotifs }),
      setSecurityAlerts: (securityAlerts) => set({ securityAlerts }),
      setDataCollection: (dataCollection) => set({ dataCollection }),
      setCrashReports: (crashReports) => set({ crashReports }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setUpdateStatus: (updateStatus) => set({ updateStatus })
    }),
    {
      name: 'aionx-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
        accentColor: state.accentColor,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
        updateNotifs: state.updateNotifs,
        securityAlerts: state.securityAlerts,
        dataCollection: state.dataCollection,
        crashReports: state.crashReports,
        compactMode: state.compactMode,
        fontSize: state.fontSize
      })
    }
  )
)
