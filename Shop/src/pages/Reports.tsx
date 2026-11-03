import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { buildReport, saleProfit } from '../services/reports'
import type { ReportPeriod } from '../services/reports'
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
  const [period] = useState<ReportPeriod>('today')

  const unitList = useMemo(() => units ?? [], [units])
  const saleList = useMemo(() => sales ?? [], [sales])
  const brandList = useMemo(() => brands ?? [], [brands])
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
  const saleCount = completed.length
  const revenueTotal = completed.reduce((sum, sale) => sum + sale.total, 0)
  const averageSale = saleCount > 0 ? revenueTotal / saleCount : 0

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
            <Button variant="secondary" icon="download" onClick={() => undefined}>
              {t('reports.exportStock')}
            </Button>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard label={t('reports.revenue')} value={formatMoney(report.revenue.IQD, 'IQD')} icon="chart" hint={formatMoney(report.revenue.USD, 'USD')} />
        <StatCard label={t('reports.profit')} value={formatMoney(report.profit.IQD, 'IQD')} icon="trending" hint={formatMoney(report.profit.USD, 'USD')} />
        <StatCard label={t('reports.salesCount')} value={report.salesCount} icon="receipt" hint={t('reports.avgSale', { value: formatMoney(averageSale, 'IQD') })} />
        <StatCard label={t('reports.stockValue')} value={formatMoney(report.stock.retailIQD, 'IQD')} icon="wallet" hint={formatMoney(report.stock.retailByCurrency.USD, 'USD')} />
      </div>

      <Card>
        <SectionHeader title={t('reports.salesReport')} subtitle={t('reports.reportFor', { period: t(`reports.${period}`) })} icon="receipt" />
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
