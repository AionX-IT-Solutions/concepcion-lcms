import { ipcMain, BrowserWindow, app, shell, Notification } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { IPC_CHANNELS, type NotificationPayload } from '../shared/ipc-types'

export function registerIpcHandlers(): void {
  // ── App ──────────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => app.getVersion())

  // ── Window ───────────────────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false
  })

  // ── Shell ────────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, (_, url: string) => {
    shell.openExternal(url)
  })

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.ZOOM_SET, (event, factor: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, factor))
    event.sender.setZoomFactor(clamped)
  })

  // ── Logging ──────────────────────────────────────────────────────────────────
  ipcMain.on(IPC_CHANNELS.LOG_INFO, (_, msg: string) => log.info('[renderer]', msg))
  ipcMain.on(IPC_CHANNELS.LOG_WARN, (_, msg: string) => log.warn('[renderer]', msg))
  ipcMain.on(IPC_CHANNELS.LOG_ERROR, (_, msg: string) => log.error('[renderer]', msg))

  // ── Native Notifications ─────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SHOW, (_, payload: NotificationPayload) => {
    if (Notification.isSupported()) {
      new Notification({ title: payload.title, body: payload.body }).show()
    }
  })

  // ── Auto-updater ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      log.error('Manual update check failed:', err)
    }
  })

  ipcMain.on(IPC_CHANNELS.UPDATE_INSTALL, () => {
    autoUpdater.quitAndInstall()
  })
}
