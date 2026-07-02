import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron API bridge
Object.defineProperty(window, 'api', {
  value: {
    getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
    window: {
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
      isMaximized: vi.fn().mockResolvedValue(false)
    },
    shell: { openExternal: vi.fn() },
    setZoomFactor: vi.fn().mockResolvedValue(undefined),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    update: {
      check: vi.fn().mockResolvedValue(undefined),
      install: vi.fn(),
      onStatus: vi.fn(() => vi.fn())
    },
    notification: { show: vi.fn().mockResolvedValue(undefined) },
    onShortcut: vi.fn(() => vi.fn())
  },
  writable: true
})

// Mock import.meta.env
vi.stubGlobal('import_meta_env', {
  BASE_URL: '/',
  MODE: 'test',
  DEV: false,
  PROD: false,
  VITE_APP_NAME: 'AionX'
})
