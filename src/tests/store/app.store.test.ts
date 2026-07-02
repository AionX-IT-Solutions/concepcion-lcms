import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../../renderer/src/store/app.store'

beforeEach(() => {
  useAppStore.setState({
    isAuthenticated: false,
    theme: 'dark',
    language: 'en',
    accentColor: 'indigo',
    notifications: [],
    sidebarCollapsed: false,
    notificationsEnabled: true,
    soundEnabled: false,
    dataCollection: false,
    compactMode: false,
    fontSize: [14],
    updateStatus: null
  })
})

describe('app.store', () => {
  describe('auth', () => {
    it('starts unauthenticated', () => {
      expect(useAppStore.getState().isAuthenticated).toBe(false)
    })

    it('login with valid credentials sets isAuthenticated', () => {
      const ok = useAppStore.getState().login('admin', 'pass1')
      expect(ok).toBe(true)
      expect(useAppStore.getState().isAuthenticated).toBe(true)
    })

    it('login with empty username returns false', () => {
      const ok = useAppStore.getState().login('', 'pass1')
      expect(ok).toBe(false)
      expect(useAppStore.getState().isAuthenticated).toBe(false)
    })

    it('login with short password returns false', () => {
      const ok = useAppStore.getState().login('user', 'abc')
      expect(ok).toBe(false)
      expect(useAppStore.getState().isAuthenticated).toBe(false)
    })

    it('logout clears isAuthenticated', () => {
      useAppStore.getState().login('admin', 'pass1')
      useAppStore.getState().logout()
      expect(useAppStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('theme', () => {
    it('initial theme is dark', () => {
      expect(useAppStore.getState().theme).toBe('dark')
    })

    it('toggleTheme switches dark → light', () => {
      useAppStore.getState().toggleTheme()
      expect(useAppStore.getState().theme).toBe('light')
    })

    it('toggleTheme switches light → dark', () => {
      useAppStore.getState().setTheme('light')
      useAppStore.getState().toggleTheme()
      expect(useAppStore.getState().theme).toBe('dark')
    })
  })

  describe('language', () => {
    it('initial language is en', () => {
      expect(useAppStore.getState().language).toBe('en')
    })

    it('setLanguage updates language', () => {
      useAppStore.getState().setLanguage('tl')
      expect(useAppStore.getState().language).toBe('tl')
    })
  })

  describe('notifications', () => {
    it('addNotification appends to array', () => {
      useAppStore.getState().addNotification({ type: 'info', message: 'Test' })
      const { notifications } = useAppStore.getState()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].message).toBe('Test')
      expect(notifications[0].type).toBe('info')
    })

    it('removeNotification removes by id', () => {
      useAppStore.getState().addNotification({ type: 'info', message: 'A' })
      useAppStore.getState().addNotification({ type: 'info', message: 'B' })
      const id = useAppStore.getState().notifications[0].id
      useAppStore.getState().removeNotification(id)
      expect(useAppStore.getState().notifications).toHaveLength(1)
      expect(useAppStore.getState().notifications[0].message).toBe('B')
    })

    it('clearNotifications empties array', () => {
      useAppStore.getState().addNotification({ type: 'info', message: 'X' })
      useAppStore.getState().clearNotifications()
      expect(useAppStore.getState().notifications).toHaveLength(0)
    })
  })

  describe('updateStatus', () => {
    it('initial updateStatus is null', () => {
      expect(useAppStore.getState().updateStatus).toBeNull()
    })

    it('setUpdateStatus stores status', () => {
      useAppStore.getState().setUpdateStatus({ status: 'available', version: '2.0.0' })
      expect(useAppStore.getState().updateStatus?.status).toBe('available')
    })
  })
})
