import { useCallback } from 'react'
import { ShopError } from '../services/inventory'
import { useI18n, type TranslationKey } from './I18nProvider'
import { en } from './en'

export function useErrorMessage() {
  const { t } = useI18n()
  return useCallback(
    (error: unknown): string => {
      if (error instanceof ShopError) {
        const key = `error.${error.code}` as TranslationKey
        if (key in en) return t(key)
      }
      if (error instanceof Error && error.message) return error.message
      return t('error.unknown')
    },
    [t]
  )
}
