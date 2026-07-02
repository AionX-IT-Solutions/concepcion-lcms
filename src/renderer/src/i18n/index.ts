import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import tl from './locales/tl'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tl: { translation: tl }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n
