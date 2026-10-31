import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { useErrorMessage } from '../i18n/useError'
import { returnSale } from '../services/inventory'
import { formatMoney } from '../services/money'
import { Button, Card, ConfirmDialog, EmptyState, Field, PageHeader, SearchInput } from '../components/ui'
import { useConfirm } from '../components/ui'
import type { Sale, SaleStatus } from '../types'

export default function SalesHistoryPage() {
  const { t } = useI18n()
  const { user } = useApp()
  const error = useErrorMessage()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const sales = useLiveQuery(() => db.sales.toArray(), [])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'' | SaleStatus>('')

  const [returnTarget, setReturnTarget] = useState<Sale | null>(null)
  const [returnReason, setReturnReason] = useState('')
  const [returnBusy, setReturnBusy] = useState(false)

  const saleList = useMemo(() => sales ?? [], [sales])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return saleList
      .filter((s) => {
        if (status && s.status !== status) return false
        if (!q) return true
        const hay = [s.invoiceNo, s.modelName, s.brandName, s.barcode, s.customerName, s.customerPhone].join(' ').toLowerCase()
        return hay.includes(q)
      })
      .slice()
      .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
  }, [saleList, query, status])

  const doReturn = async () => {
    if (!returnTarget || !user) return
    if (!returnReason.trim()) return
    setReturnBusy(true)
    try {
      const updated = await returnSale(returnTarget.id, returnReason.trim(), user)
      setReturnTarget(null)
      setReturnReason('')
      const ok = await confirm(t('common.saved'), t('sales.returnedOk'))
      void ok
      navigate(`/sales/${updated.id}`)
    } catch (err) {
      error(err)
    } finally {
      setReturnBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('sales.title')}
        subtitle={t('sales.subtitle')}
        actions={
          <Button icon="download" onClick={() => undefined}>
            {t('sales.exportCsv')}
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder={t('sales.search')} ariaLabel={t('sales.search')} />
          <select value={status} onChange={(e) => setStatus(e.target.value as '' | SaleStatus)} style={{ width: 'auto' }} aria-label={t('sales.status')}>
            <option value="">{t('common.all')}</option>
            <option value="completed">{t('sales.completed')}</option>
            <option value="returned">{t('sales.returned')}</option>
            <option value="reversed">{t('sales.reversed')}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="receipt" title={t('sales.noSales')} text={t('sales.noSalesHint')} />
        ) : (
          <div className="list">
            {filtered.map((sale) => (
              <div className="list-row" key={sale.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/${sale.id}`)}>
                <div className="list-row-main">
                  <div className="list-row-title">{sale.invoiceNo}</div>
                  <div className="list-row-sub">
                    {sale.modelName} · {sale.staffName} · {sale.customerName || t('sales.customerOptional')}
                  </div>
                </div>
                <div className="money">{formatMoney(sale.total, sale.currency)}</div>
                <span className="badge badge-neutral">{t(`sales.${sale.status}` as never)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        onConfirm={() => void doReturn()}
        title={t('sales.returnTitle')}
        message={t('sales.returnConfirm')}
        confirmLabel={t('sales.return')}
        danger
        loading={returnBusy}
      >
        <Field label={t('sales.returnReason')} required>
          <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
