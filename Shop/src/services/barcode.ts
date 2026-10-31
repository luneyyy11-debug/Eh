import JsBarcode from 'jsbarcode'
import { db } from '../db/db'
import { randomCode } from './id'

export async function generateUniqueBarcode(rerolls = 0): Promise<string> {
  const candidate = `SHP-${Date.now().toString(36).toUpperCase()}${randomCode(3)}`
  const clash = await db.units.where('barcode').equals(candidate).first()
  if (clash) {
    if (rerolls > 6) throw new Error('Could not generate a unique barcode')
    return generateUniqueBarcode(rerolls + 1)
  }
  return candidate
}

export async function generateUniqueShortId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = randomCode(6)
    const clash = await db.units.where('shortId').equals(candidate).first()
    if (!clash) return candidate
  }
  return randomCode(8)
}

export interface BarcodeOptions {
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  margin?: number
  lineColor?: string
  background?: string
}

/** Returns a self-contained SVG string usable in labels and print windows. */
export function barcodeSvg(value: string, options: BarcodeOptions = {}): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value || 'EMPTY', {
    format: 'CODE128',
    width: options.width ?? 1.7,
    height: options.height ?? 54,
    displayValue: options.displayValue ?? true,
    font: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: options.fontSize ?? 14,
    margin: options.margin ?? 6,
    lineColor: options.lineColor ?? '#0b1f3a',
    background: options.background ?? '#ffffff'
  })
  return svg.outerHTML
}

export async function findUnitByCode(code: string) {
  const clean = code.trim()
  if (!clean) return undefined
  const byBarcode = await db.units.where('barcode').equals(clean).first()
  if (byBarcode) return byBarcode
  const upper = clean.toUpperCase()
  return (await db.units.where('shortId').equals(upper).first()) ?? (await db.units.where('barcode').equals(upper).first())
}

export async function barcodeExists(barcode: string, exceptUnitId?: string): Promise<boolean> {
  const found = await db.units.where('barcode').equals(barcode.trim()).first()
  return Boolean(found && found.id !== exceptUnitId)
}

export async function imeiExists(imei: string, exceptUnitId?: string): Promise<boolean> {
  const clean = imei.trim()
  if (!clean) return false
  const found = await db.units.where('imei1').equals(clean).first()
  if (found && found.id !== exceptUnitId) return true
  const all = await db.units.toArray()
  return all.some((u) => u.id !== exceptUnitId && u.imei2.trim() === clean)
}
