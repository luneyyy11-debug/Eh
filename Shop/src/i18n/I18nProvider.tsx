import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Language } from '../types'
import { db } from '../db/db'
import { en, type TranslationKey } from './en'
import { ckb } from './ckb'

const dictionaries = { en, ckb }
const STORAGE_KEY = 'dukan-language'

interface I18nContextValue {
  language: Language
  dir: 'ltr' | 'rtl'
  isRTL: boolean
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  formatDate: (iso: string | Date, options?: Intl.DateTimeFormatOptions) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

function readInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'ckb') return stored
  } catch {
    // localStorage can be unavailable in private contexts
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ckb' ? 'rtl' : 'ltr'
    document.body.classList.toggle('is-rtl', language === 'ckb')
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Ignore storage errors
    }
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    void db.settings
      .update('shop', { language: next })
      .catch(() => undefined)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const raw = dictionaries[language][key] ?? en[key] ?? key
      return interpolate(raw, vars)
    },
    [language]
  )

  const formatDate = useCallback(
    (iso: string | Date, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' }) => {
      const date = typeof iso === 'string' ? new Date(iso) : iso
      if (Number.isNaN(date.getTime())) return '—'
      const locale = language === 'ckb' ? 'ckb-IQ' : 'en-GB'
      try {
        return new Intl.DateTimeFormat(locale, options).format(date)
      } catch {
        return new Intl.DateTimeFormat('en-GB', options).format(date)
      }
    },
    [language]
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      dir: language === 'ckb' ? 'rtl' : 'ltr',
      isRTL: language === 'ckb',
      setLanguage,
      t,
      formatDate
    }),
    [language, setLanguage, t, formatDate]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

export type { TranslationKey }
