import type { Currency, InventoryUnit, Sale, UnitStatus } from '../types'
import { convertMinor } from './money'

export type ReportPeriod = 'today' | 'week' | 'month' | 'all'

export interface CurrencyTotals {
  IQD: number
  USD: number
}

export const emptyTotals = (): CurrencyTotals => ({ IQD: 0, USD: 0 })

export function addToTotals(totals: CurrencyTotals, currency: Currency, amount: number): void {
  totals[currency] += amount
}

export function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function rangeFor(period: ReportPeriod, now = new Date()): { start: Date | null; end: Date } {
  const end = new Date(now.getTime() + 1000)
  if (period === 'all') return { start: null, end }
  if (period === 'today') return { start: startOfDay(now), end }
  if (period === 'week') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - 6)
    return { start, end }
  }
  const start = startOfDay(now)
  start.setDate(1)
  return { start, end }
}

export function inPeriod(iso: string, period: ReportPeriod, now = new Date()): boolean {
  const { start, end } = rangeFor(period, now)
  const time = new Date(iso).getTime()
  if (start && time < start.getTime()) return false
  return time < end.getTime()
}

export function saleProfit(sale: Sale): number {
  const costInSaleCurrency = convertMinor(
    sale.purchaseCostSnapshot,
    sale.purchaseCurrency,
    sale.currency,
    sale.exchangeRate
  )
  return sale.total - costInSaleCurrency
}

export function unitCostInIQD(unit: InventoryUnit, currentRate: number): number {
  return convertMinor(unit.purchaseCost, unit.purchaseCurrency, 'IQD', currentRate)
}

export function unitRetailInIQD(unit: InventoryUnit, currentRate: number): number {
  return convertMinor(unit.sellingPrice, unit.sellingCurrency, 'IQD', currentRate)
}

export interface StockSummary {
  total: number
  inStock: number
  sold: number
  returned: number
  repair: number
  reserved: number
  writtenOff: number
  costByCurrency: CurrencyTotals
  retailByCurrency: CurrencyTotals
  costIQD: number
  retailIQD: number
}

export function summarizeStock(units: InventoryUnit[], rate: number): StockSummary {
  const summary: StockSummary = {
    total: units.length,
    inStock: 0,
    sold: 0,
    returned: 0,
    repair: 0,
    reserved: 0,
    writtenOff: 0,
    costByCurrency: emptyTotals(),
    retailByCurrency: emptyTotals(),
    costIQD: 0,
    retailIQD: 0
  }
  for (const unit of units) {
    switch (unit.status) {
      case 'in_stock':
        summary.inStock += 1
        addToTotals(summary.costByCurrency, unit.purchaseCurrency, unit.purchaseCost)
        addToTotals(summary.retailByCurrency, unit.sellingCurrency, unit.sellingPrice)
        summary.costIQD += unitCostInIQD(unit, rate)
        summary.retailIQD += unitRetailInIQD(unit, rate)
        break
      case 'sold':
        summary.sold += 1
        break
      case 'returned':
        summary.returned += 1
        break
      case 'repair':
        summary.repair += 1
        break
      case 'reserved':
        summary.reserved += 1
        break
      case 'written_off':
        summary.writtenOff += 1
        break
    }
  }
  return summary
}

export interface PeriodReport {
  period: ReportPeriod
  sales: Sale[]
  salesCount: number
  returnedCount: number
  revenue: CurrencyTotals
  profit: CurrencyTotals
  discount: CurrencyTotals
  bestSellers: { modelId: string; modelName: string; brandName: string; image: string; count: number; revenueIQD: number }[]
  stockByBrand: { brandId: string; brandName: string; count: number; costIQD: number; retailIQD: number }[]
  trend: { date: string; count: number; revenueIQD: number }[]
  stock: StockSummary
}

export interface ReportInput {
  units: InventoryUnit[]
  sales: Sale[]
  rate: number
  brandNames: Record<string, string>
  period: ReportPeriod
}

export function buildReport({ units, sales, rate, brandNames, period }: ReportInput): PeriodReport {
  const filtered = sales.filter((sale) => inPeriod(sale.soldAt, period))
  const completed = filtered.filter((sale) => sale.status === 'completed')
  const revenue = emptyTotals()
  const profit = emptyTotals()
  const discount = emptyTotals()

  for (const sale of completed) {
    addToTotals(revenue, sale.currency, sale.total)
    addToTotals(profit, sale.currency, saleProfit(sale))
    addToTotals(discount, sale.currency, sale.discount)
  }

  const bestMap = new Map<string, { modelId: string; modelName: string; brandName: string; image: string; count: number; revenueIQD: number }>()
  for (const sale of completed) {
    const current = bestMap.get(sale.modelId) ?? {
      modelId: sale.modelId,
      modelName: sale.modelName,
      brandName: sale.brandName,
      image: sale.image,
      count: 0,
      revenueIQD: 0
    }
    current.count += 1
    current.revenueIQD += convertMinor(sale.total, sale.currency, 'IQD', sale.exchangeRate)
    bestMap.set(sale.modelId, current)
  }

  const stock = summarizeStock(units, rate)
  const brandMap = new Map<string, { brandId: string; brandName: string; count: number; costIQD: number; retailIQD: number }>()
  for (const unit of units.filter((u) => u.status === 'in_stock')) {
    const current = brandMap.get(unit.brandId) ?? {
      brandId: unit.brandId,
      brandName: brandNames[unit.brandId] ?? unit.brandId,
      count: 0,
      costIQD: 0,
      retailIQD: 0
    }
    current.count += 1
    current.costIQD += unitCostInIQD(unit, rate)
    current.retailIQD += unitRetailInIQD(unit, rate)
    brandMap.set(unit.brandId, current)
  }

  const trend: { date: string; count: number; revenueIQD: number }[] = []
  const now = new Date()
  const allCompleted = sales.filter((sale) => sale.status === 'completed')
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(now)
    day.setDate(day.getDate() - i)
    const key = localDateKey(day)
    const daySales = allCompleted.filter((sale) => localDateKey(new Date(sale.soldAt)) === key)
    trend.push({
      date: key,
      count: daySales.length,
      revenueIQD: daySales.reduce((sum, sale) => sum + convertMinor(sale.total, sale.currency, 'IQD', sale.exchangeRate), 0)
    })
  }

  return {
    period,
    sales: filtered.sort((a, b) => b.soldAt.localeCompare(a.soldAt)),
    salesCount: completed.length,
    returnedCount: filtered.filter((sale) => sale.status === 'returned').length,
    revenue,
    profit,
    discount,
    bestSellers: [...bestMap.values()].sort((a, b) => b.count - a.count || b.revenueIQD - a.revenueIQD).slice(0, 8),
    stockByBrand: [...brandMap.values()].sort((a, b) => b.count - a.count),
    trend,
    stock
  }
}

export function statusLabelKey(status: UnitStatus): string {
  return `status.${status}`
}
