import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { useErrorMessage } from '../i18n/useError'
import { changeUnitStatus } from '../services/inventory'
import { barcodeSvg } from '../services/barcode'
import { formatMoney } from '../services/money'
import { printHtml } from '../services/print'
import { Button, Card, ConfirmDialog, EmptyState, Field, PageHeader, StatusBadge } from '../components/ui'
import { Icon } from '../components/Icon'
import { useConfirm } from '../components/ui'
import type { UnitStatus } from '../types'

const STATUS_OPTIONS: UnitStatus[] = ['in_stock', 'repair', 'reserved', 'returned', 'written_off']

export default function UnitDetailsPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const { t } = useI18n()
  const { user } = useApp()
  const confirm = useConfirm()
  const error = useErrorMessage()
  const unit = useLiveQuery(() => db.units.get(unitId ?? ''), [unitId])
  const movements = useLiveQuery(() => (unitId ? db.movements.where('unitId').equals(unitId).toArray() : []), [unitId])

  const unitData = unit
  const movementList = movements ?? []

  const stockAgeDays = useMemo(() => {
    if (!unitData) return 0
    const created = new Date(unitData.createdAt).getTime()
    if (Number.isNaN(created)) return 0
    return Math.max(0, Math.floor((Date.now() - created) / 86400000))
  }, [unitData])

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTo, setStatusTo] = useState<UnitStatus | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)

  if (!unitData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title={t('unit.title')} />
        <Card>
          <EmptyState icon="box" title={t('unit.notFound')} text={t('unit.notFoundHint')} />
        </Card>
      </div>
    )
  }

  const cost = unitData.purchaseCost / (unitData.purchaseCurrency === 'USD' ? 100 : 1)
  const price = unitData.sellingPrice / (unitData.sellingCurrency === 'USD' ? 100 : 1)
  const margin = price - cost

  const printLabel = () => {
    const svg = barcodeSvg(unitData.barcode, { displayValue: true })
    printHtml(t('addStock.barcode'), `<div class="label"><div class="name">${unitData.shortId}</div><div class="barcode">${svg}</div></div>`, 'en')
  }

  const submitStatus = async () => {
    if (!statusTo || !user) return
    setStatusBusy(true)
    try {
      await changeUnitStatus(unitData.id, statusTo, statusReason, user)
      const ok = await confirm(t('common.saved'), t('unit.statusUpdated'))
      void ok
      setStatusOpen(false)
      setStatusTo(null)
    } catch (err) {
      error(err)
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('unit.title')}
        subtitle={unitData.shortId}
        actions={
          <>
            <Link to="/stock" className="btn btn-secondary">
              {t('unit.back')}
            </Link>
            <Button icon="printer" onClick={printLabel}>
              {t('unit.printLabel')}
            </Button>
          </>
        }
      />

      <div className="grid grid-2">
        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="phone" size={18} />
              </span>
              <div>
                <h2>{t('unit.overview')}</h2>
              </div>
            </div>
            <StatusBadge status={unitData.status} />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="model-image model-image-md" style={{ width: 96, height: 96 }}>
              <img src={`/catalog/placeholder.svg`} alt="" style={{ display: 'none' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{unitData.shortId}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {unitData.ram} / {unitData.storage} · {unitData.colour}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t('unit.stockAge', { days: stockAgeDays })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="section-header" style={{ marginTop: 0 }}>
            <div className="section-title-wrap">
              <span className="section-icon">
                <Icon name="wallet" size={18} />
              </span>
              <div>
                <h2>{t('unit.pricing')}</h2>
              </div>
            </div>
          </div>
          <div className="grid" style={{ gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">{t('unit.price')}</span>
              <span className="money">{formatMoney(unitData.sellingPrice, unitData.sellingCurrency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">{t('unit.cost')}</span>
              <span className="money">{formatMoney(cost, unitData.purchaseCurrency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">{t('unit.margin')}</span>
              <span className="money">{formatMoney(margin, unitData.sellingCurrency)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <span className="section-icon">
              <Icon name="barcode" size={18} />
            </span>
            <div>
              <h2>{t('unit.identifiers')}</h2>
            </div>
          </div>
        </div>
        <div className="grid" style={{ gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">{t('unit.barcode')}</span>
            <span className="money">{unitData.barcode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">{t('unit.shortId')}</span>
            <span className="money">{unitData.shortId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">{t('unit.battery')}</span>
            <span>{unitData.batteryHealth == null ? t('unit.batteryNone') : `${unitData.batteryHealth}%`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">{t('unit.condition')}</span>
            <span>{t(`condition.${unitData.condition}` as never)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-header" style={{ marginTop: 0 }}>
          <div className="section-title-wrap">
            <span className="section-icon">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <h2>{t('unit.history')}</h2>
            </div>
          </div>
        </div>
        {movementList.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>
            {t('unit.timelineEmpty')}
          </div>
        ) : (
          <div className="list">
            {movementList.map((m) => (
              <div className="list-row" key={m.id}>
                <div className="list-row-main">
                  <div className="list-row-title">{t(`movement.${m.type}` as never)}</div>
                  <div className="list-row-sub">
                    {m.reason} · {new Date(m.at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={() => void submitStatus()}
        title={t('unit.changeStatusTitle')}
        message={t('unit.statusUpdate')}
        confirmLabel={t('common.confirm')}
        danger
        loading={statusBusy}
      >
        <Field label={t('unit.selectStatus')}>
          <select value={statusTo ?? ''} onChange={(e) => setStatusTo(e.target.value as UnitStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`status.${option}` as never)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('unit.reason')} required error={statusReason ? undefined : t('unit.reasonRequired')}>
          <input type="text" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
