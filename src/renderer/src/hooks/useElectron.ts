import { useEffect, useState } from 'react'
import type { UpdateStatus, NotificationPayload } from '../../../shared/ipc-types'

type NodePlatform = 'aix' | 'android' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32' | 'cygwin' | 'netbsd'

declare global {
  interface Window {
    electron?: {
      process: {
        platform: NodePlatform
      }
    }
    api: {
      getAppVersion: () => Promise<string>
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
      }
      shell: {
        openExternal: (url: string) => Promise<void>
      }
      setZoomFactor: (factor: number) => Promise<void>
      log: {
        info: (msg: string) => void
        warn: (msg: string) => void
        error: (msg: string) => void
      }
      update: {
        check: () => Promise<void>
        install: () => void
        onStatus: (cb: (status: UpdateStatus) => void) => () => void
      }
      notification: {
        show: (payload: NotificationPayload) => Promise<void>
      }
      onShortcut: (cb: (key: string) => void) => () => void
    }
  }
}

export function useElectron() {
  const [appVersion, setAppVersion] = useState<string>('1.0.0')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api
      ?.getAppVersion()
      .then(setAppVersion)
      .catch(() => {})
    window.api?.window
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => {})
  }, [])

  return {
    appVersion,
    isMaximized,
    platform: window.electron?.process.platform,
    minimize: () => window.api?.window.minimize(),
    maximize: () => {
      window.api?.window.maximize()
      setIsMaximized((prev) => !prev)
    },
    close: () => window.api?.window.close(),
    openExternal: (url: string) => window.api?.shell.openExternal(url)
  }
}

export function useLogger() {
  return {
    info: (msg: string) => window.api?.log.info(msg),
    warn: (msg: string) => window.api?.log.warn(msg),
    error: (msg: string) => window.api?.log.error(msg)
  }
}
