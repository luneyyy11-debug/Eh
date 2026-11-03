import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useApp } from '../context/AppContext'
import { useI18n } from '../i18n/I18nProvider'
import { findUnitByCode } from '../services/barcode'
import { formatMoney } from '../services/money'
import { toCsv, downloadFile } from '../services/csv'
import { Button, Card, EmptyState, PageHeader, SearchInput, StatusBadge } from '../components/ui'
import { ModelImage } from '../components/ui'
import type { Condition, UnitStatus } from '../types'

export default function StockPage() {
  const { t } = useI18n()
  useApp()
  const navigate = useNavigate()
  const units = useLiveQuery(() => db.units.toArray(), [])
  const brands = useLiveQuery(() => db.brands.toArray(), [])
  const models = useLiveQuery(() => db.models.toArray(), [])

  const [query, setQuery] = useState('')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState<'' | UnitStatus>('')
  const [condition, setCondition] = useState<'' | Condition>('')
  const [sort] = useState<'newest' | 'priceHigh' | 'priceLow'>('newest')
  const [scan, setScan] = useState('')

  const unitList = useMemo(() => units ?? [], [units])
  const brandList = useMemo(() => brands ?? [], [brands])
  const modelList = useMemo(() => models ?? [], [models])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = unitList.filter((u) => {
      if (brandId && u.brandId !== brandId) return false
      if (status && u.status !== status) return false
      if (condition && u.condition !== condition) return false
      if (!q) return true
      const model = modelList.find((m) => m.id === u.modelId)
      const brand = brandList.find((b) => b.id === u.brandId)
      const hay = [u.barcode, u.shortId, u.imei1, u.imei2, u.serial, model?.name ?? '', brand?.name ?? '', u.colour, u.ram, u.storage]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    rows = rows.slice().sort((a, b) => {
      if (sort === 'priceHigh') return b.sellingPrice - a.sellingPrice
      if (sort === 'priceLow') return a.sellingPrice - b.sellingPrice
      return b.createdAt.localeCompare(a.createdAt)
    })
    return rows
  }, [unitList, query, brandId, status, condition, sort, brandList, modelList])

  const doScan = async () => {
    const found = await findUnitByCode(scan)
    if (found) navigate(`/stock/${found.id}`)
  }

  const exportCsv = () => {
    const headers = ['shortId', 'barcode', 'model', 'brand', 'variant', 'condition', 'battery', 'status', 'sellingPrice', 'sellingCurrency', 'purchaseCost', 'purchaseCurrency', 'barcodeImei']
    const rows = filtered.map((u) => [
      u.shortId,
      u.barcode,
      modelList.find((m) => m.id === u.modelId)?.name ?? u.modelId,
      brandList.find((b) => b.id === u.brandId)?.name ?? u.brandId,
      `${u.ram} / ${u.storage} · ${u.colour}`,
      u.condition,
      u.batteryHealth ?? '',
      u.status,
      (u.sellingPrice / (u.sellingCurrency === 'USD' ? 100 : 1)).toFixed(u.sellingCurrency === 'USD' ? 2 : 0),
      u.sellingCurrency,
      (u.purchaseCost / (u.purchaseCurrency === 'USD' ? 100 : 1)).toFixed(u.purchaseCurrency === 'USD' ? 2 : 0),
      u.purchaseCurrency,
      u.imei1
    ])
    downloadFile(`stock-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows))
  }

  return (
    <div className="stock-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={t('stock.title')}
        subtitle={t('stock.subtitle')}
        actions={
          <Button icon="plus" onClick={() => void navigate('/add')}>
            {t('stock.add')}
          </Button>
        }
      />

      <Card>
        <div className="toolbar stock-filters">
          <SearchInput value={query} onChange={setQuery} placeholder={t('stock.search')} ariaLabel={t('stock.search')} />
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={{ width: 'auto' }} aria-label={t('stock.brand')}>
            <option value="">{t('stock.allBrands')}</option>
            {brandList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as UnitStatus | '')} style={{ width: 'auto' }} aria-label={t('stock.status')}>
            <option value="">{t('stock.allStatuses')}</option>
            <option value="in_stock">In stock</option>
            <option value="sold">Sold</option>
            <option value="returned">Returned</option>
            <option value="repair">Repair</option>
            <option value="reserved">Reserved</option>
            <option value="written_off">Written off</option>
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value as Condition | '')} style={{ width: 'auto' }} aria-label={t('stock.condition')}>
            <option value="">{t('common.all')}</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="refurbished">Refurbished</option>
          </select>
          <div className="spacer" />
          <Button variant="secondary" icon="download" onClick={exportCsv}>
            {t('stock.exportCsv')}
          </Button>
        </div>

        <div className="stock-scan" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <SearchInput value={scan} onChange={setScan} placeholder={t('stock.scanPlaceholder')} ariaLabel={t('stock.scanPlaceholder')} />
          <Button onClick={() => void doScan()} icon="scan">
            {t('stock.scanPlaceholder')}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="box" title={t('stock.noUnits')} text={t('stock.noUnitsHint')} />
        ) : (
          <div className="list">
            {filtered.map((u) => (
              <div className="list-row stock-unit-row" key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${u.id}`)}>
                <ModelImage src={modelList.find((m) => m.id === u.modelId)?.image} alt={u.shortId} size="sm" />
                <div className="list-row-main">
                  <div className="list-row-title">{modelList.find((m) => m.id === u.modelId)?.name ?? u.modelId}</div>
                  <div className="list-row-sub">
                    {u.shortId} · {u.ram} / {u.storage} · {u.colour}
                  </div>
                </div>
                <div className="money stock-unit-price">{formatMoney(u.sellingPrice, u.sellingCurrency)}</div>
                <span className="stock-unit-status"><StatusBadge status={u.status} /></span>
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          {t('stock.showing', { shown: filtered.length, total: unitList.length })}
        </p>
      </Card>
    </div>
  )
}
