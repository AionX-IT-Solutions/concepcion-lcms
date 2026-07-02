import { app, shell, BrowserWindow, Tray, Menu, nativeImage, globalShortcut } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import windowStateKeeper from 'electron-window-state'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers } from './ipc'
import { initSentryMain, captureException } from './sentry'
import { IPC_CHANNELS, type UpdateStatus } from '../shared/ipc-types'

// Sentry must be initialized BEFORE anything else can crash
initSentryMain()

const isDev = !app.isPackaged

// ── App icon ──────────────────────────────────────────────────────────────────
// resources/icon.png is fed to electron-builder to generate platform icons at
// build time (see package.json "build"), and copied via "extraResources" so it's
// also available at runtime (packaged apps read from process.resourcesPath; in
// dev the source tree is used directly since out/main sits next to resources/).
const iconPath = isDev
  ? join(__dirname, '../../resources/icon.png')
  : join(process.resourcesPath, 'icon.png')
const appIcon = nativeImage.createFromPath(iconPath)

// ── Logging setup ─────────────────────────────────────────────────────────────
log.transports.file.level = 'info'
log.transports.console.level = isDev ? 'debug' : 'warn'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err)
})

log.info('LCMS starting up', { version: app.getVersion(), isDev })

// ── Auto-updater setup (production only) ──────────────────────────────────────
function sendUpdateStatus(status: UpdateStatus): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.UPDATE_STATUS, status)
    }
  })
}

function setupAutoUpdater(): void {
  autoUpdater.logger = log

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    sendUpdateStatus({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
    sendUpdateStatus({ status: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No update available')
    sendUpdateStatus({ status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({ status: 'downloading', progress: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)
    sendUpdateStatus({ status: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err)
    sendUpdateStatus({ status: 'error', error: err.message })
  })
}

// ── Tray ──────────────────────────────────────────────────────────────────────
let tray: Tray | null = null

function createTray(mainWindow: BrowserWindow): void {
  const trayIcon = appIcon.isEmpty() ? appIcon : appIcon.resize({ width: 32, height: 32 })

  tray = new Tray(trayIcon)
  tray.setToolTip('LCMS')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show LCMS',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow.show()
    }
  })
}

// ── Window keyboard shortcuts ─────────────────────────────────────────────────
function watchWindowShortcuts(window: BrowserWindow): void {
  const { webContents } = window
  webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (isDev && input.code === 'F12') {
      if (webContents.isDevToolsOpened()) {
        webContents.closeDevTools()
      } else {
        webContents.openDevTools({ mode: 'undocked' })
      }
    }
    if (!isDev && input.code === 'KeyR' && (input.control || input.meta)) {
      event.preventDefault()
    }
  })
}

// ── Create window ─────────────────────────────────────────────────────────────
function createWindow(): void {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  })

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: appIcon,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // sandbox: false is required because the preload script uses Node.js APIs
      // (ipcRenderer, contextBridge). Enable sandbox: true only if the preload
      // is refactored to avoid any direct Node API calls.
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindowState.manage(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    log.info('Main window shown')
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'undocked' })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    log.info('Main window closed')
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createTray(mainWindow)
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(isDev ? process.execPath : 'com.aionx.boilerplate')
  }

  app.on('browser-window-created', (_, window) => {
    watchWindowShortcuts(window)
  })

  // Crash reporting
  app.on('render-process-gone', (_, webContents, details) => {
    const err = new Error(`Renderer gone: ${details.reason} (exit ${details.exitCode})`)
    captureException(err)
    log.error('Renderer process gone:', { url: webContents.getURL(), ...details })
  })

  app.on('child-process-gone', (_, details) => {
    const err = new Error(`Child process gone: ${details.type} — ${details.reason}`)
    captureException(err)
    log.error('Child process gone:', details)
  })

  registerIpcHandlers()
  createWindow()

  // Global shortcuts
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    log.info('Global shortcut triggered: CommandOrControl+Shift+A')
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.SHORTCUT_TRIGGERED, 'CommandOrControl+Shift+A')
      }
    })
  })

  // Auto-updater (production only)
  if (!isDev) {
    setupAutoUpdater()
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.error('Failed to check for updates:', err)
    })
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  log.info('App ready')
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  log.info('App quitting, global shortcuts unregistered')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
