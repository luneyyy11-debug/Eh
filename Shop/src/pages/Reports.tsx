import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { buildReport, saleProfit } from '../services/reports'
import type { CurrencyTotals, ReportPeriod } from '../services/reports'
import { formatMoney } from '../services/money'
import { toCsv, downloadFile } from '../services/csv'
import { Button, Card, EmptyState, PageHeader, SectionHeader, StatCard } from '../components/ui'
import { ModelImage } from '../components/ui'

export default function ReportsPage() {
  const { t } = useI18n()
  const { settings } = useApp()
  const units = useLiveQuery(() => db.units.toArray(), [])
  const sales = useLiveQuery(() => db.sales.toArray(), [])
  const brands = useLiveQuery(() => db.brands.toArray(), [])
  const models = useLiveQuery(() => db.models.toArray(), [])
  const [period, setPeriod] = useState<ReportPeriod>('today')

  const unitList = useMemo(() => units ?? [], [units])
  const saleList = useMemo(() => sales ?? [], [sales])
  const brandList = useMemo(() => brands ?? [], [brands])
  const modelsById = useMemo(() => new Map((models ?? []).map((model) => [model.id, model])), [models])
  const brandNamesById = useMemo(() => new Map(brandList.map((brand) => [brand.id, brand.name])), [brandList])
  const rate = settings?.exchangeRate ?? 0

  const report = useMemo(
    () =>
      buildReport({
        units: unitList,
        sales: saleList,
        rate,
        brandNames: Object.fromEntries(brandList.map((brand) => [brand.id, brand.name])),
        period
      }),
    [unitList, saleList, brandList, rate, period]
  )

  const completed = useMemo(() => report.sales.filter((sale) => sale.status === 'completed'), [report])
  const averageSale = useMemo(() => {
    const totals: CurrencyTotals = { IQD: 0, USD: 0 }
    const counts: CurrencyTotals = { IQD: 0, USD: 0 }
    for (const sale of completed) {
      totals[sale.currency] += sale.total
      counts[sale.currency] += 1
    }
    return {
      IQD: counts.IQD ? totals.IQD / counts.IQD : 0,
      USD: counts.USD ? totals.USD / counts.USD : 0
    }
  }, [completed])

  const exportSales = () => {
    const headers = ['invoiceNo', 'soldAt', 'model', 'brand', 'variant', 'imeiMasked', 'staffName', 'customerName', 'currency', 'salePrice', 'discount', 'total', 'cost', 'profit', 'paymentMethod', 'status']
    const rows = report.sales.map((sale) => [
      sale.invoiceNo,
      sale.soldAt,
      sale.modelName,
      sale.brandName,
      sale.variantLabel,
      sale.imeiMasked,
      sale.staffName,
      sale.customerName,
      sale.currency,
      sale.salePrice,
      sale.discount,
      sale.total,
      sale.purchaseCostSnapshot,
      saleProfit(sale),
      sale.paymentMethod,
      sale.status
    ])
    downloadFile(`sales-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  const exportStock = () => {
    const headers = [
      'shortId', 'barcode', 'model', 'brand', 'ram', 'storage', 'colour', 'condition',
      'status', 'imei1', 'serial', 'purchaseCost', 'purchaseCurrency', 'sellingPrice',
      'sellingCurrency', 'dateReceived'
    ]
    const rows = unitList.map((unit) => [
      unit.shortId,
      unit.barcode,
      modelsById.get(unit.modelId)?.name ?? unit.modelId,
      brandNamesById.get(unit.brandId) ?? unit.brandId,
      unit.ram,
      unit.storage,
      unit.colour,
      unit.condition,
      unit.status,
      unit.imei1,
      unit.serial,
      unit.purchaseCost,
      unit.purchaseCurrency,
      unit.sellingPrice,
      unit.sellingCurrency,
      unit.dateReceived
    ])
    downloadFile(`stock-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  const averageSaleLabel = `${formatMoney(averageSale.IQD, 'IQD')} · ${formatMoney(averageSale.USD, 'USD')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={exportSales}>
              {t('reports.exportSales')}
            </Button>
            <Button variant="secondary" icon="download" onClick={exportStock}>
              {t('reports.exportStock')}
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label={t('reports.revenue')} value={formatMoney(report.revenue.IQD, 'IQD')} icon="chart" hint={formatMoney(report.revenue.USD, 'USD')} />
        <StatCard label={t('reports.profit')} value={formatMoney(report.profit.IQD, 'IQD')} icon="trending" hint={formatMoney(report.profit.USD, 'USD')} />
        <StatCard label={t('reports.salesCount')} value={report.salesCount} icon="receipt" hint={t('reports.avgSale', { value: averageSaleLabel })} />
        <StatCard label={t('reports.stockValue')} value={formatMoney(report.stock.retailIQD, 'IQD')} icon="wallet" hint={formatMoney(report.stock.retailByCurrency.USD, 'USD')} />
      </div>

      <Card>
        <div className="toolbar">
          <SectionHeader title={t('reports.salesReport')} subtitle={t('reports.reportFor', { period: t(`reports.${period}`) })} icon="receipt" />
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            style={{ width: 'auto' }}
            aria-label={t('reports.period')}
          >
            {(['today', 'week', 'month', 'all'] as const).map((value) => (
              <option key={value} value={value}>{t(`reports.${value}`)}</option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid grid-2">
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('reports.revenue')}
              </div>
              <div className="money" style={{ fontSize: 20, fontWeight: 800 }}>
                {formatMoney(report.revenue.IQD, 'IQD')}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {t('reports.profit')}
              </div>
              <div className="money" style={{ fontSize: 20, fontWeight: 800 }}>
                {formatMoney(report.profit.IQD, 'IQD')}
              </div>
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('reports.discounts')}
            </div>
            <div className="money">{formatMoney(report.discount.IQD, 'IQD')}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('reports.returned')}
            </div>
            <div className="money">{report.returnedCount}</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={t('reports.bestSellers')} subtitle={t('reports.noBestSellers')} icon="trending" />
        {report.bestSellers.length === 0 ? (
          <EmptyState icon="chart" title={t('reports.noBestSellers')} text={t('reports.noData')} />
        ) : (
          <div className="list">
            {report.bestSellers.map((row) => (
              <div className="list-row" key={row.modelId}>
                <ModelImage src={row.image} alt={row.modelName} size="sm" />
                <div className="list-row-main">
                  <div className="list-row-title">{row.modelName}</div>
                  <div className="list-row-sub">{row.brandName}</div>
                </div>
                <div className="muted">{t('reports.unitCount', { count: row.count })}</div>
                <div className="money">{formatMoney(row.revenueIQD, 'IQD')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title={t('reports.byBrand')} subtitle={t('reports.stockByBrand')} icon="box" />
        {report.stockByBrand.length === 0 ? (
          <EmptyState icon="box" title={t('reports.noStock')} text={t('reports.noData')} />
        ) : (
          <div className="list">
            {report.stockByBrand.map((row) => (
              <div className="list-row" key={row.brandId}>
                <div className="list-row-main">
                  <div className="list-row-title">{row.brandName}</div>
                </div>
                <div className="muted">{t('reports.unitCount', { count: row.count })}</div>
                <div className="money">{formatMoney(row.costIQD, 'IQD')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title={t('reports.trend')} subtitle={t('reports.trend')} icon="chart" />
        <div className="list" style={{ marginTop: 16 }}>
          {report.trend.map((row) => (
            <div className="list-row" key={row.date}>
              <div className="list-row-main">
                <div className="list-row-title">{row.date}</div>
              </div>
              <div className="muted">{t('reports.salesInPeriod')}</div>
              <div className="money">{formatMoney(row.revenueIQD, 'IQD')}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
