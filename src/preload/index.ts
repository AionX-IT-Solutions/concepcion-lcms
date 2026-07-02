import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS, type UpdateStatus, type NotificationPayload } from '../shared/ipc-types'

const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.APP_VERSION),

  window: {
    minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED)
  },

  shell: {
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, url)
  },

  setZoomFactor: (factor: number): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.ZOOM_SET, factor),

  log: {
    info: (msg: string) => ipcRenderer.send(IPC_CHANNELS.LOG_INFO, msg),
    warn: (msg: string) => ipcRenderer.send(IPC_CHANNELS.LOG_WARN, msg),
    error: (msg: string) => ipcRenderer.send(IPC_CHANNELS.LOG_ERROR, msg)
  },

  update: {
    check: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),
    install: () => ipcRenderer.send(IPC_CHANNELS.UPDATE_INSTALL),
    onStatus: (cb: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_: unknown, status: UpdateStatus) => cb(status)
      ipcRenderer.on(IPC_CHANNELS.UPDATE_STATUS, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_STATUS, listener)
    }
  },

  notification: {
    show: (payload: NotificationPayload): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_SHOW, payload)
  },

  onShortcut: (cb: (key: string) => void): (() => void) => {
    const listener = (_: unknown, key: string) => cb(key)
    ipcRenderer.on(IPC_CHANNELS.SHORTCUT_TRIGGERED, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SHORTCUT_TRIGGERED, listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error -- window globals not typed outside Electron context
  window.electron = electronAPI
  // @ts-expect-error -- window globals not typed outside Electron context
  window.api = api
}
