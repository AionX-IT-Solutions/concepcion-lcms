import { useAppStore } from '../store/app.store'
import { useEffect } from 'react'
import i18n from '../i18n'

const accentMap = {
  indigo: {
    primary: '#6366f1',
    primaryHover: '#7c7ff5',
    glow: 'rgba(99,102,241,0.4)',
    subtle: 'rgba(99,102,241,0.1)'
  },
  cyan: {
    primary: '#06b6d4',
    primaryHover: '#22d3ee',
    glow: 'rgba(6,182,212,0.4)',
    subtle: 'rgba(6,182,212,0.1)'
  },
  emerald: {
    primary: '#10b981',
    primaryHover: '#34d399',
    glow: 'rgba(16,185,129,0.4)',
    subtle: 'rgba(16,185,129,0.1)'
  },
  rose: {
    primary: '#f43f5e',
    primaryHover: '#fb7185',
    glow: 'rgba(244,63,94,0.4)',
    subtle: 'rgba(244,63,94,0.1)'
  }
}

export function useTheme() {
  const accentColor = useAppStore((s) => s.accentColor)
  const theme = useAppStore((s) => s.theme)
  const fontSize = useAppStore((s) => s.fontSize)
  const language = useAppStore((s) => s.language)
  const compactMode = useAppStore((s) => s.compactMode)

  // Sync persisted language to i18n on mount + change
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language])

  // Apply light/dark class
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
  }, [theme])

  // Apply accent colours
  useEffect(() => {
    const { primary, primaryHover, glow, subtle } = accentMap[accentColor]
    const root = document.documentElement
    root.style.setProperty('--accent-primary', primary)
    root.style.setProperty('--accent-primary-hover', primaryHover)
    root.style.setProperty('--accent-primary-glow', glow)
    root.style.setProperty('--accent-primary-subtle', subtle)
    root.style.setProperty('--border-focus', `${primary}99`)
  }, [accentColor])

  // Apply font size via Electron's native webContents zoom — keeps layout correct
  useEffect(() => {
    const factor = fontSize[0] / 14
    window.api?.setZoomFactor(factor).catch(() => {
      // Fallback for non-Electron environments
      document.documentElement.style.fontSize = `${fontSize[0]}px`
    })
  }, [fontSize])

  // Apply compact mode
  useEffect(() => {
    const root = document.documentElement
    if (compactMode) {
      root.classList.add('compact')
    } else {
      root.classList.remove('compact')
    }
  }, [compactMode])

  return { accentColor, theme, fontSize, language, compactMode }
}
