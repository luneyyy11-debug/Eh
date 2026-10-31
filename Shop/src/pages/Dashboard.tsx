import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { summarizeStock, inPeriod, saleProfit, addToTotals, emptyTotals } from '../services/reports'
import type { CurrencyTotals } from '../services/reports'
import { formatMoney } from '../services/money'
import { Card, EmptyState, PageHeader, StatCard, Badge } from '../components/ui'
import { Icon } from '../components/Icon'

const saleStatusKey = (status: string) => `sales.${status}`

export default function DashboardPage() {
  const { settings, user } = useApp()
  const { t } = useI18n()
  const units = useLiveQuery(() => db.units.toArray(), [])
  const sales = useLiveQuery(() => db.sales.toArray(), [])
  const brands = useLiveQuery(() => db.brands.toArray(), [])

  const unitList = useMemo(() => units ?? [], [units])
  const saleList = useMemo(() => sales ?? [], [sales])
  const brandList = useMemo(() => brands ?? [], [brands])
  const rate = settings?.exchangeRate ?? 0

  const inStock = useMemo(() => unitList.filter((u) => u.status === 'in_stock'), [unitList])
  const stock = useMemo(() => summarizeStock(inStock, rate), [inStock, rate])

  const todaySales = useMemo(
    () => saleList.filter((s) => s.status === 'completed' && inPeriod(s.soldAt, 'today')),
    [saleList]
  )

  const todayTotals = useMemo(() => {
    const revenue: CurrencyTotals = emptyTotals()
    const profit: CurrencyTotals = emptyTotals()
    for (const sale of todaySales) {
      addToTotals(revenue, sale.currency, sale.total)
      addToTotals(profit, sale.currency, saleProfit(sale))
    }
    return { revenue, profit }
  }, [todaySales])

  const recentSales = useMemo(
    () =>
      saleList
        .filter((s) => s.status === 'completed')
        .slice()
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
        .slice(0, 5),
    [saleList]
  )

  const stockByBrand = useMemo(() => {
    const map = new Map<string, { brandId: string; brandName: string; count: number }>()
    for (const unit of inStock) {
      const current = map.get(unit.brandId) ?? {
        brandId: unit.brandId,
        brandName: brandList.find((b) => b.id === unit.brandId)?.name ?? unit.brandId,
        count: 0
      }
      current.count += 1
      map.set(unit.brandId, current)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [inStock, brandList])

  const greeting = t('dashboard.greeting', { name: user?.name ?? '' })

  const todayProfitIQD = todayTotals.profit.IQD + todayTotals.profit.USD * rate

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={greeting}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Link to="/add" className="btn btn-primary">
            <Icon name="plusCircle" size={16} />
            {t('dashboard.addStock')}
          </Link>
        }
      />

      <div className="stat-grid">
        <StatCard label={t('dashboard.inStock')} value={stock.inStock} icon="box" hint={t('dashboard.inStockHint', { count: stock.inStock })} />
        <StatCard label={t('dashboard.stockValue')} value={formatMoney(stock.retailIQD, 'IQD')} icon="wallet" hint={t('dashboard.stockValueHint')} />
        <StatCard label={t('dashboard.todaySales')} value={todaySales.length} icon="receipt" hint={t('dashboard.todaySalesHint', { count: todaySales.length })} />
        <StatCard label={t('dashboard.profitToday')} value={formatMoney(todayProfitIQD, 'IQD')} icon="trending" hint={t('dashboard.profitHint')} />
      </div>

      <div className="grid grid-2">
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="receipt" size={18} />
              </span>
              <div>
                <h2>{t('dashboard.recentSales')}</h2>
              </div>
            </div>
            <Link to="/sales" className="btn btn-ghost btn-sm">
              {t('common.viewAll')}
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <EmptyState icon="receipt" title={t('dashboard.noSales')} text={t('dashboard.noSalesHint')} />
          ) : (
            <div className="list">
              {recentSales.map((sale) => (
                <div className="list-row" key={sale.id}>
                  <div className="list-row-main">
                    <div className="list-row-title">{sale.invoiceNo}</div>
                    <div className="list-row-sub">
                      {sale.modelName} · {sale.variantLabel}
                    </div>
                  </div>
                  <div className="money">{formatMoney(sale.total, sale.currency)}</div>
                  <Badge tone={saleStatusKey(sale.status) === 'success' ? 'success' : 'neutral'}>{t(saleStatusKey(sale.status) as never)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="chart" size={18} />
              </span>
              <div>
                <h2>{t('dashboard.stockByBrand')}</h2>
              </div>
            </div>
          </div>
          {stockByBrand.length === 0 ? (
            <EmptyState icon="box" title={t('dashboard.noBrands')} text={t('dashboard.noBrands')} />
          ) : (
            <div className="list">
              {stockByBrand.map((row) => (
                <div className="list-row" key={row.brandId}>
                  <div className="list-row-main">
                    <div className="list-row-title">{row.brandName}</div>
                    <div className="list-row-sub">{t('dashboard.brandUnits', { count: row.count })}</div>
                  </div>
                  <div className="money">{formatMoney(stock.retailIQD / Math.max(1, stockByBrand.length), 'IQD')}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
