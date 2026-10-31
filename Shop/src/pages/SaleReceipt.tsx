import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useI18n } from '../i18n/I18nProvider'
import { printHtml, escapeHtml, formatDateTime } from '../services/print'
import { barcodeSvg } from '../services/barcode'
import { formatMoney } from '../services/money'
import { saleProfit } from '../services/reports'
import { Badge, Barcode, Button, Card, EmptyState, PageHeader } from '../components/ui'
import type { SaleStatus } from '../types'

const SALE_TONE: Record<SaleStatus, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  returned: 'warning',
  reversed: 'danger'
}

export default function SaleReceiptPage() {
  const { saleId } = useParams<{ saleId: string }>()
  const { t, language } = useI18n()
  const sale = useLiveQuery(() => db.sales.get(saleId ?? ''), [saleId])
  const saleData = sale

  const profit = useMemo(() => (saleData ? saleProfit(saleData) : 0), [saleData])

  const printReceipt = () => {
    if (!saleData) return
    const rows = [
      `<div class="row"><span>${escapeHtml(t('receipt.saleDate'))}</span><span>${escapeHtml(formatDateTime(saleData.soldAt, language))}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.item'))}</span><span>${escapeHtml(saleData.modelName)} · ${escapeHtml(saleData.variantLabel)}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.price'))}</span><span class="num">${formatMoney(saleData.salePrice, saleData.currency)}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.discount'))}</span><span class="num">${formatMoney(saleData.discount, saleData.currency)}</span></div>`,
      `<div class="row row-total"><span>${escapeHtml(t('receipt.total'))}</span><span class="num">${formatMoney(saleData.total, saleData.currency)}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.payment'))}</span><span>${escapeHtml(t(`payment.${saleData.paymentMethod}` as never))}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.customer'))}</span><span>${escapeHtml(saleData.customerName || t('sales.customerOptional'))}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.seller'))}</span><span>${escapeHtml(saleData.staffName)}</span></div>`,
      `<div class="row"><span>${escapeHtml(t('receipt.imei'))}</span><span>${escapeHtml(saleData.imeiMasked)}</span></div>`
    ].join('')
    const html = `<div class="header"><div class="brand">${escapeHtml(t('app.name'))}</div><h1>${escapeHtml(t('receipt.title'))}</h1><div>${escapeHtml(t('receipt.invoice'))}: ${escapeHtml(saleData.invoiceNo)}</div></div>${rows}<div class="barcode">${barcodeSvg(saleData.barcode, { displayValue: true })}</div><div>${escapeHtml(t('receipt.thanks'))}</div>`
    printHtml(t('receipt.title'), html, language)
  }

  if (!saleData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title={t('receipt.title')} />
        <Card>
          <EmptyState icon="receipt" title={t('error.sale_missing')} text={t('sales.noSalesHint')} />
        </Card>
      </div>
    )
  }

  const tone = SALE_TONE[saleData.status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('receipt.title')}
        subtitle={saleData.invoiceNo}
        actions={
          <>
            <Link to="/sales" className="btn btn-secondary">
              {t('receipt.backToSales')}
            </Link>
            <Button icon="printer" onClick={printReceipt}>
              {t('receipt.print')}
            </Button>
          </>
        }
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{saleData.modelName}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {saleData.variantLabel}
            </div>
          </div>
          <Badge tone={tone}>{t(`sales.${saleData.status}` as never)}</Badge>
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.saleDate')}
            </div>
            <div>{formatDateTime(saleData.soldAt, language)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.item')}
            </div>
            <div>
              {saleData.modelName} · {saleData.variantLabel}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.price')}
            </div>
            <div className="money">{formatMoney(saleData.salePrice, saleData.currency)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.discount')}
            </div>
            <div className="money">{formatMoney(saleData.discount, saleData.currency)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.total')}
            </div>
            <div className="money" style={{ fontSize: 20, fontWeight: 800 }}>
              {formatMoney(saleData.total, saleData.currency)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.payment')}
            </div>
            <div>{t(`payment.${saleData.paymentMethod}` as never)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.customer')}
            </div>
            <div>{saleData.customerName || t('sales.customerOptional')}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('receipt.seller')}
            </div>
            <div>{saleData.staffName}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {t('sales.profit')}
            </div>
            <div className="money">{formatMoney(profit, saleData.currency)}</div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="barcode">
            <Barcode value={saleData.barcode} displayValue />
          </div>
        </div>

        {saleData.status !== 'completed' ? (
          <div style={{ marginTop: 18 }}>
            <p style={{ margin: 0 }}>
              {t('receipt.returnedOn')} {saleData.returnedAt ? formatDateTime(saleData.returnedAt, language) : ''}
            </p>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {t('receipt.returnReason')} {saleData.returnReason ?? ''}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
