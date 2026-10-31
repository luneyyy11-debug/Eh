import type { Currency } from '../types'

export const CURRENCIES: Currency[] = ['IQD', 'USD']

export function minorFactor(currency: Currency): number {
  return currency === 'USD' ? 100 : 1
}

/** Parse a human-entered amount into integer minor units (IQD dinars, USD cents). */
export function parseAmount(input: string | number, currency: Currency): number {
  const raw = typeof input === 'number' ? String(input) : input
  const cleaned = raw.replace(/[,\s]/g, '').replace(/[^\d.]/g, '')
  if (!cleaned) return 0
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value * minorFactor(currency))
}

export function toMajor(minor: number, currency: Currency): number {
  return minor / minorFactor(currency)
}

export function fromMajor(major: number, currency: Currency): number {
  return Math.round(major * minorFactor(currency))
}

/** Convert between currencies using IQD-per-USD rate. Returns integer minor units. */
export function convertMinor(amount: number, from: Currency, to: Currency, rate: number): number {
  if (from === to) return amount
  if (!rate || rate <= 0) return amount
  if (from === 'USD' && to === 'IQD') return Math.round((amount / 100) * rate)
  return Math.round((amount / rate) * 100)
}

export function formatMoney(minor: number, currency: Currency, compact = false): string {
  const major = toMajor(minor, currency)
  const decimals = currency === 'USD' ? 2 : 0
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: compact ? 1 : decimals,
    notation: compact ? 'compact' : 'standard'
  })
  if (currency === 'USD') return `$${formatter.format(major)}`
  return `${formatter.format(major)} IQD`
}

export function formatMoneyPlain(minor: number, currency: Currency): string {
  return `${formatMoney(minor, currency)} `
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function percent(value: number): string {
  return `${Math.round(value)}%`
}

export function priceInputValue(minor: number, currency: Currency): string {
  return String(toMajor(minor, currency))
}
